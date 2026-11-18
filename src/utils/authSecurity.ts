/**
 * Authentication & Sensitive Data Security Utilities
 *
 * Implements defensive validation and lifecycle state-machine helpers for:
 * 1. Logout sequencing and in-flight marker cleanup.
 * 2. Auth state-change event ordering and dispatch decisions.
 * 3. Sensitive data refresh association with initiating user ID and sequence.
 * 4. Profile resolution failure isolation and stale-signout prevention.
 * 5. Role-based backup export authorization.
 */

export interface SensitiveRefreshContext {
  refreshSeq: number;
  currentRefreshSeq: number;
  currentRole: 'admin' | 'editor' | null;
  adminRole: 'admin' | 'editor' | null;
  initiatingUserId: string | null;
  currentUserId: string | null;
}

export interface SignOutDecisionContext {
  currentSeq: number;
  latestAuthSeq: number;
  targetUserId?: string | null;
  currentSessionUserId?: string | null;
}

/**
 * Determines whether an authentication operation is authorized to invoke supabase.auth.signOut().
 * Strictly prevents an outdated or superseded operation from destroying a newer session.
 * When a target user ID exists, a missing or different current session user ID CANNOT authorize sign-out.
 */
export function shouldPerformSignOut(ctx: SignOutDecisionContext): boolean {
  // If the operation is superseded by a newer auth request, never sign out
  if (ctx.currentSeq !== ctx.latestAuthSeq) {
    return false;
  }
  // When a target user ID exists, a missing or different current session user ID cannot authorize sign-out
  if (ctx.targetUserId) {
    return Boolean(ctx.currentSessionUserId && ctx.currentSessionUserId === ctx.targetUserId);
  }
  return true;
}

export interface ProfileResolutionContext {
  currentSeq: number;
  latestAuthSeq: number;
  isMounted?: boolean;
  profileError: unknown;
  profile: { role?: string | null; designation?: string | null; full_name?: string | null } | null;
  resolvingUserId?: string;
  previousVerifiedUserId?: string | null;
  previousRole?: 'admin' | 'editor' | null;
  currentLiveUserId?: string | null;
  /** Alias for resolvingUserId */
  initiatingUserId?: string;
  /** Alias for previousVerifiedUserId */
  currentUserId?: string | null;
}

export interface ProfileResolutionResult {
  canApply: boolean;
  failClosed: boolean;
  shouldSignOut: boolean;
  role: 'admin' | 'editor' | null;
  isAccountSwitch: boolean;
  isRoleDowngrade: boolean;
  error?: string;
}

/**
 * Serializes asynchronous authentication mutations (signIn, signOut) to guarantee
 * deterministic last-intent execution without overlapping network writes to client storage.
 */
export class AuthMutationQueue {
  private tail: Promise<void> = Promise.resolve();

  async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const prev = this.tail;
    let release: () => void = () => {};
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.tail = next;

    try {
      await prev.catch(() => {});
      return await operation();
    } finally {
      release();
    }
  }
}

/**
 * Evaluates a staff profile lookup outcome against sequence tokens and user identity:
 * - Distinguishes confirmed missing/unauthorized profiles from temporary network/query errors.
 * - On uncertainty (profileError), fails closed in UI without destroying valid session.
 * - Marks a downgrade ONLY when previous verified role was admin and new verified role is editor.
 * - Preserves previous user ID context across legitimate account switches.
 */
export function evaluateProfileResolution(ctx: ProfileResolutionContext): ProfileResolutionResult {
  const isMounted = ctx.isMounted !== undefined ? ctx.isMounted : true;
  const targetUserId = ctx.resolvingUserId || ctx.initiatingUserId || '';
  const prevUserId = ctx.previousVerifiedUserId !== undefined ? ctx.previousVerifiedUserId : (ctx.currentUserId ?? null);
  const prevRole = ctx.previousRole ?? null;

  // Discard resolution if unmounted or superseded by newer auth request
  if (!isMounted || ctx.currentSeq !== ctx.latestAuthSeq) {
    return {
      canApply: false,
      failClosed: false,
      shouldSignOut: false,
      role: null,
      isAccountSwitch: false,
      isRoleDowngrade: false,
    };
  }

 // Reject a result if the live session identity is missing or differs.
// Undefined means the caller did not supply a live-session check.
if (
  ctx.currentLiveUserId !== undefined &&
  ctx.currentLiveUserId !== targetUserId
) {
  return {
    canApply: false,
    failClosed: false,
    shouldSignOut: false,
    role: null,
    isAccountSwitch: false,
    isRoleDowngrade: false,
  };
}

  const isAccountSwitch = Boolean(prevUserId && prevUserId !== targetUserId);

  // Temporary network or query failure: fail closed in UI, but DO NOT destroy Supabase session
  if (ctx.profileError) {
    return {
      canApply: true,
      failClosed: true,
      shouldSignOut: false, // Do NOT sign out on temporary network failure
      role: null,
      isAccountSwitch,
      isRoleDowngrade: false,
      error: 'Temporary profile verification error'
    };
  }

  // Confirmed missing staff profile: fail closed AND sign out
  if (!ctx.profile) {
    return {
      canApply: true,
      failClosed: true,
      shouldSignOut: true,
      role: null,
      isAccountSwitch,
      isRoleDowngrade: false,
      error: 'No staff profile found for this account'
    };
  }

  const role = ctx.profile.role === 'admin' || ctx.profile.role === 'editor'
    ? ctx.profile.role
    : null;

  // Confirmed unauthorized / revoked role: fail closed AND sign out
  if (!role) {
    return {
      canApply: true,
      failClosed: true,
      shouldSignOut: true,
      role: null,
      isAccountSwitch,
      isRoleDowngrade: false,
      error: 'This account does not have administrator or editor access.'
    };
  }

  // Mark a downgrade ONLY when previous verified role was admin and new verified role is editor
  const isRoleDowngrade = Boolean(prevRole === 'admin' && role === 'editor');

  return {
    canApply: true,
    failClosed: false,
    shouldSignOut: false,
    role,
    isAccountSwitch,
    isRoleDowngrade,
  };
}

export interface SupabaseAuthClient {
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{
    data: { user: { id: string; email?: string | null } | null; session?: any } | null;
    error: { message: string } | null;
  }>;
  signOut: () => Promise<{ error: { message: string } | null }>;
  getSession: () => Promise<{
    data: { session: { user: { id: string; email?: string | null } } | null };
    error: { message: string } | null;
  }>;
}

export interface SupabaseClientLike {
  auth: SupabaseAuthClient;
  from: (table: string) => any;
}

export interface AuthCoordinatorCallbacks {
  onLoading?: (loading: boolean) => void;
  onResetState?: () => void;
  onAuthenticated?: (user: {
    userId: string;
    email: string | null;
    role: 'admin' | 'editor';
    designation: string | null;
  }) => void;
  onMemberAuthenticated?: (user: {
    userId: string;
    email: string | null;
    fullName?: string | null;
  }) => void;
  onAccountSwitch?: (previousUserId: string, newUserId: string) => void;
  onRoleDowngrade?: (newRole: 'editor') => void;
  onRefreshNeeded?: () => void;
}

/**
 * Shared coordinator for all application-initiated Supabase Auth mutations.
 * Enforces mutual exclusion, sequence checking, and safe internal non-deadlocking sign-outs.
 */
export class AuthCoordinator {
  private latestAuthSeq = 0;
  private currentUserId: string | null = null;
  private currentRole: 'admin' | 'editor' | null = null;
  private inFlightLoginSeq: number | null = null;
  private inFlightLogoutSeq: number | null = null;
  private queue = new AuthMutationQueue();

  getLatestSeq(): number {
    return this.latestAuthSeq;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  getCurrentRole(): 'admin' | 'editor' | null {
    return this.currentRole;
  }

  getInFlightLoginSeq(): number | null {
    return this.inFlightLoginSeq;
  }

  getInFlightLogoutSeq(): number | null {
    return this.inFlightLogoutSeq;
  }

  nextSeq(): number {
    return ++this.latestAuthSeq;
  }

  resetInternalState(): void {
    this.currentUserId = null;
    this.currentRole = null;
    this.inFlightLoginSeq = null;
    this.inFlightLogoutSeq = null;
  }

  /**
   * Safe internal sign-out for operations already executing under the coordinator lock.
   * Avoids nested queue deadlocks by invoking supabase.auth.signOut directly after
   * verifying session ownership with shouldPerformSignOut.
   */
 
  async signOutInternal(
    currentSeq: number,
    targetUserId: string,
    supabase: SupabaseClientLike
  ): Promise<boolean> {
    try {
      const { data: curSession, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error('Unable to verify session before sign-out:', sessionError);
        return false;
      }

      const currentSessionUserId = curSession?.session?.user?.id;

      const canSignOut = shouldPerformSignOut({
        currentSeq,
        latestAuthSeq: this.latestAuthSeq,
        targetUserId,
        currentSessionUserId,
      });

      if (!canSignOut) return false;

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('AuthCoordinator sign-out failed:', signOutError);
        return false;
      }

      return true;
    } catch (err) {
      console.error('AuthCoordinator signOutInternal error:', err);
      return false;
    }
  }

  async login(

    email: string,
    password: string,
    supabase: SupabaseClientLike,
    callbacks: AuthCoordinatorCallbacks
  ): Promise<{ ok: boolean; error?: string }> {
    const currentSeq = ++this.latestAuthSeq;
    this.inFlightLoginSeq = currentSeq;
    callbacks.onLoading?.(true);

    return this.queue.enqueue(async () => {
      // 1. If superseded while waiting in queue, abort immediately
      if (currentSeq !== this.latestAuthSeq) {
        if (this.inFlightLoginSeq === currentSeq) this.inFlightLoginSeq = null;
        return { ok: false, error: 'Authentication request was superseded by a newer request.' };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        // 2. Check if superseded while awaiting signInWithPassword
        if (currentSeq !== this.latestAuthSeq) {
          if (this.inFlightLoginSeq === currentSeq) this.inFlightLoginSeq = null;
          return { ok: false, error: 'Authentication request was superseded by a newer request.' };
        }

        if (error || !data?.user) {
          if (this.inFlightLoginSeq === currentSeq) this.inFlightLoginSeq = null;
          if (currentSeq === this.latestAuthSeq) {
            this.resetInternalState();
            callbacks.onResetState?.();
          }
          return { ok: false, error: error?.message || 'Unable to sign in.' };
        }

        const userId = data.user.id;
        const prevUserId = this.currentUserId;
        const prevRole = this.currentRole;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, designation, full_name')
          .eq('id', userId)
          .maybeSingle();

        if (this.inFlightLoginSeq === currentSeq) {
          this.inFlightLoginSeq = null;
        }

        // 3. Check if superseded while awaiting profile lookup
        if (currentSeq !== this.latestAuthSeq) {
          return { ok: false, error: 'Authentication request was superseded by a newer request.' };
        }

const {
  data: liveSessionData,
  error: liveSessionError,
} = await supabase.auth.getSession();

if (currentSeq !== this.latestAuthSeq) {
  return {
    ok: false,
    error: 'Authentication request was superseded by a newer request.',
  };
}

const currentLiveUserId = liveSessionData?.session?.user?.id ?? null;

if (liveSessionError || !currentLiveUserId) {
  this.resetInternalState();
  callbacks.onResetState?.();

  return {
    ok: false,
    error: 'Unable to verify the active session. Please sign in again.',
  };
}

        const resolution = evaluateProfileResolution({
          currentSeq,
          latestAuthSeq: this.latestAuthSeq,
          profileError,
          profile,
          resolvingUserId: userId,
          previousVerifiedUserId: prevUserId,
          previousRole: prevRole,
          currentLiveUserId,
        });

        if (!resolution.canApply) {
          return { ok: false, error: 'Authentication request was superseded by a newer request.' };
        }

        if (prevUserId && prevUserId !== userId) {
  this.currentUserId = null;
  this.currentRole = null;
  callbacks.onAccountSwitch?.(prevUserId, userId);
}

        if (profileError || !profile) {
          if (resolution.shouldSignOut) {
            await this.signOutInternal(currentSeq, userId, supabase);
          }
          if (currentSeq === this.latestAuthSeq) {
            this.resetInternalState();
            callbacks.onResetState?.();
          }
          return {
            ok: false,
            error: profileError
              ? `Profile verification error: ${(profileError as any).message || profileError}`
              : 'No staff profile found for this account. Access denied.'
          };
        }

        const role = resolution.role;
        if (!role) {
          // Authenticated profile without staff role: treat as community member session when supported.
          if (profile && callbacks.onMemberAuthenticated) {
            this.currentUserId = userId;
            this.currentRole = null;
            callbacks.onMemberAuthenticated({
              userId,
              email: data.user.email || null,
              fullName: profile.full_name || null,
            });
            callbacks.onLoading?.(false);
            callbacks.onRefreshNeeded?.();
            return { ok: true, member: true } as { ok: boolean; error?: string; member?: boolean };
          }

          if (resolution.shouldSignOut) {
            await this.signOutInternal(currentSeq, userId, supabase);
          }
          if (currentSeq === this.latestAuthSeq) {
            this.resetInternalState();
            callbacks.onResetState?.();
          }
          return { ok: false, error: resolution.error || 'This account does not have administrator or editor access.' };
        }

        this.currentUserId = userId;
        this.currentRole = role;

        callbacks.onAuthenticated?.({
          userId,
          email: data.user.email || null,
          role,
          designation: profile.designation || null,
        });

        if (resolution.isRoleDowngrade) {
          callbacks.onRoleDowngrade?.('editor');
        }

        callbacks.onLoading?.(false);
        callbacks.onRefreshNeeded?.();
        return { ok: true };
      } catch (err: any) {
        if (this.inFlightLoginSeq === currentSeq) this.inFlightLoginSeq = null;
        if (currentSeq === this.latestAuthSeq) {
          this.resetInternalState();
          callbacks.onResetState?.();
        }
        return { ok: false, error: err?.message || 'Authentication error.' };
      }
    });
  }

  async logout(
    supabase: SupabaseClientLike,
    callbacks: AuthCoordinatorCallbacks
  ): Promise<{ ok: boolean; error?: string }> {
    const currentSeq = ++this.latestAuthSeq;
    this.inFlightLogoutSeq = currentSeq;
    callbacks.onLoading?.(true);

    return this.queue.enqueue(async () => {
      // 1. Check if superseded while waiting in queue
      if (currentSeq !== this.latestAuthSeq) {
        this.inFlightLogoutSeq = clearInFlightLogout(this.inFlightLogoutSeq, currentSeq);
        return { ok: false, error: 'Logout request was superseded.' };
      }

      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase sign-out failed:', error);
          callbacks.onLoading?.(false);
          return {
            ok: false,
            error: `Sign-out failed: ${error.message}. You remain authenticated.`
          };
        }
      } catch (err: any) {
        console.error('Supabase sign-out exception:', err);
        callbacks.onLoading?.(false);
        return {
          ok: false,
          error: `Sign-out encountered an error: ${err?.message || err}. You remain authenticated.`
        };
      }

      // 2. Check if superseded while awaiting signOut
      if (currentSeq !== this.latestAuthSeq) {
        this.inFlightLogoutSeq = clearInFlightLogout(this.inFlightLogoutSeq, currentSeq);
        return { ok: false, error: 'Logout request was superseded.' };
      }

      this.resetInternalState();
      callbacks.onResetState?.();
      callbacks.onLoading?.(false);
      return { ok: true };
    }).finally(() => {
      this.inFlightLogoutSeq = clearInFlightLogout(this.inFlightLogoutSeq, currentSeq);
    });
  }

  async resolveSession(
    existingSession: any,
    assignedSeq: number | undefined,
    supabase: SupabaseClientLike,
    callbacks: AuthCoordinatorCallbacks
  ): Promise<void> {
    const currentSeq = assignedSeq ?? ++this.latestAuthSeq;
    callbacks.onLoading?.(true);

    return this.queue.enqueue(async () => {
      if (currentSeq !== this.latestAuthSeq) return;

      try {
        let session = existingSession;
        if (!session) {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !data?.session?.user) {
            if (currentSeq === this.latestAuthSeq) {
              this.resetInternalState();
              callbacks.onResetState?.();
            }
            return;
          }
          session = data.session;
        }

        if (currentSeq !== this.latestAuthSeq || !session?.user) {
          return;
        }

        const userId = session.user.id;
        const prevUserId = this.currentUserId;
        const prevRole = this.currentRole;


        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, designation, full_name')
          .eq('id', userId)
          .maybeSingle();

        if (currentSeq !== this.latestAuthSeq) return;

        const {
  data: liveSessionData,
  error: liveSessionError,
} = await supabase.auth.getSession();

if (currentSeq !== this.latestAuthSeq) return;

const currentLiveUserId = liveSessionData?.session?.user?.id ?? null;

if (liveSessionError || !currentLiveUserId) {
  this.resetInternalState();
  callbacks.onResetState?.();
  return;
}

        const resolution = evaluateProfileResolution({
          currentSeq,
          latestAuthSeq: this.latestAuthSeq,
          profileError,
          profile,
          resolvingUserId: userId,
          previousVerifiedUserId: prevUserId,
          previousRole: prevRole,
          currentLiveUserId,
        });

        if (!resolution.canApply) {
          return;
        }

        if (prevUserId && prevUserId !== userId) {
  this.currentUserId = null;
  this.currentRole = null;
  callbacks.onAccountSwitch?.(prevUserId, userId);
}

        // Only switch accounts after confirming the incoming user
// matches the currently active Supabase session.

        if (profileError || !profile) {
          console.warn('Staff profile lookup failed or user profile not found; failing closed:', profileError ? (profileError as any).message || profileError : 'no profile');
          this.resetInternalState();
          callbacks.onResetState?.();
          if (resolution.shouldSignOut) {
            await this.signOutInternal(currentSeq, userId, supabase);
          }
          return;
        }

        const role = resolution.role;
        if (!role) {
          // Authenticated profile without staff role: community member session when supported.
          if (profile && callbacks.onMemberAuthenticated) {
            this.currentUserId = userId;
            this.currentRole = null;
            callbacks.onMemberAuthenticated({
              userId,
              email: session.user.email || null,
              fullName: profile.full_name || null,
            });
            callbacks.onLoading?.(false);
            callbacks.onRefreshNeeded?.();
            return;
          }

          console.warn('User profile could not be verified; failing closed');
          this.resetInternalState();
          callbacks.onResetState?.();
          if (resolution.shouldSignOut) {
            await this.signOutInternal(currentSeq, userId, supabase);
          }
          return;
        }

        this.currentUserId = userId;
        this.currentRole = role;

        callbacks.onAuthenticated?.({
          userId,
          email: session.user.email || null,
          role,
          designation: profile.designation || null,
        });

        if (resolution.isRoleDowngrade) {
          callbacks.onRoleDowngrade?.('editor');
        }

        callbacks.onLoading?.(false);
        callbacks.onRefreshNeeded?.();
      } catch (err) {
        console.warn('Error resolving admin session; failing closed:', err);
        if (currentSeq === this.latestAuthSeq) {
          this.resetInternalState();
          callbacks.onResetState?.();
        }
      }
    });
  }

  /**
   * Centralized sign-out entry point for confirmed role revocations detected outside the auth loop
   * (e.g. during data refresh). Queues the mutation safely through the coordinator.
   */
  async signOutForRevocation(
    targetUserId: string,
    supabase: SupabaseClientLike,
    callbacks: AuthCoordinatorCallbacks
  ): Promise<boolean> {
    const currentSeq = ++this.latestAuthSeq;
    callbacks.onLoading?.(true);

    return this.queue.enqueue(async () => {
      this.resetInternalState();
      callbacks.onResetState?.();
      const signedOut = await this.signOutInternal(currentSeq, targetUserId, supabase);
      callbacks.onLoading?.(false);
      return signedOut;
    });
  }
}

export interface BackupExportParams {
  isAdmin: boolean;
  adminRole: 'admin' | 'editor' | null;
  activeRoleRef: 'admin' | 'editor' | null;
  activeUserId: string | null;
  baseData: Record<string, unknown>;
  sensitiveData?: {
    enquiries?: unknown[];
    registrations?: unknown[];
  };
  timestamp?: string;
}

export interface BackupExportResult {
  ok: boolean;
  error?: string;
  exportPayload?: Record<string, unknown>;
  filename?: string;
}

/**
 * Safely clears the in-flight logout sequence marker if and only if it still belongs
 * to the current sequence, ensuring failed logouts do not block subsequent SIGNED_OUT events.
 */
export function clearInFlightLogout(
  currentInFlightSeq: number | null,
  sequence: number
): number | null {
  return currentInFlightSeq === sequence ? null : currentInFlightSeq;
}

/**
 * Evaluates whether an onAuthStateChange callback should process, update email,
 * defer profile resolution, or skip during active in-flight login/logout operations.
 */
export function evaluateAuthStateChange(params: {
  event: string;
  hasUser: boolean;
  inFlightLogoutSeq: number | null;
  inFlightLoginSeq: number | null;
  currentUserId: string | null;
  eventUserId: string | null;
  isAlreadyVerified: boolean;
}): {
  action: 'IGNORE_IN_FLIGHT_LOGOUT' | 'RESET_STATE' | 'IGNORE_IN_FLIGHT_LOGIN' | 'UPDATE_EMAIL_ONLY' | 'DEFER_RESOLUTION';
} {
  const {
    event,
    hasUser,
    inFlightLogoutSeq,
    inFlightLoginSeq,
    currentUserId,
    eventUserId,
    isAlreadyVerified,
  } = params;

  if (event === 'SIGNED_OUT' || !hasUser) {
    if (inFlightLogoutSeq !== null) {
      return { action: 'IGNORE_IN_FLIGHT_LOGOUT' };
    }
    return { action: 'RESET_STATE' };
  }

  if (inFlightLoginSeq !== null) {
    return { action: 'IGNORE_IN_FLIGHT_LOGIN' };
  }

  // Account switch: new user ID differs from currently verified user
  if (currentUserId && eventUserId && eventUserId !== currentUserId) {
    return { action: 'DEFER_RESOLUTION' };
  }

  // User metadata update event: revalidate profile to detect role changes/revocations
  if (event === 'USER_UPDATED') {
    return { action: 'DEFER_RESOLUTION' };
  }

  // Routine token refresh for an already verified same user: update email without redundant profile query
  if (event === 'TOKEN_REFRESHED' && currentUserId && eventUserId === currentUserId && isAlreadyVerified) {
    return { action: 'UPDATE_EMAIL_ONLY' };
  }

  return { action: 'DEFER_RESOLUTION' };
}

/**
 * Checks whether sensitive data (registrations, enquiries, staff profiles) can be applied.
 * Strictly requires that:
 * 1. The refresh sequence matches current sequence (no superseded queries).
 * 2. Synchronous role ref is 'admin'.
 * 3. State role is 'admin'.
 * 4. An initiating user ID existed at the start of refresh.
 * 5. The active user ID is STILL the exact initiating user ID (prevents Admin A data populating Admin B).
 */
export function canApplySensitiveRefresh(ctx: SensitiveRefreshContext): boolean {
  if (ctx.refreshSeq !== ctx.currentRefreshSeq) return false;
  if (ctx.currentRole !== 'admin') return false;
  if (ctx.adminRole !== 'admin') return false;
  if (!ctx.initiatingUserId) return false;
  if (ctx.currentUserId !== ctx.initiatingUserId) return false;
  return true;
}

/**
 * Constructs a JSON backup export payload while enforcing client-side role/state synchronization checks:
 * - Performs client-side role and state synchronization checks (verifying that React state `isAdmin`/`adminRole`
 *   match synchronous refs and user identity) to govern UI-level data export authorization.
 *   NOTE: This helper performs client-side state synchronization checks and does not perform independent live-session authentication
 *   against the Supabase backend. Backend database access and live queries are independently governed
 *   by Supabase authentication and Row Level Security (RLS) policies.
 * - Unauthenticated or desynchronized state is denied.
 * - Editors receive content-only exports (no attendee registrations or enquiries).
 * - Only verified admins with matching synchronized role and identity receive full administrative backups.
 */
export function buildBackupExport(params: BackupExportParams): BackupExportResult {
  const {
    isAdmin,
    adminRole,
    activeRoleRef,
    activeUserId,
    baseData,
    sensitiveData,
    timestamp = new Date().toISOString().slice(0, 10),
  } = params;

  // Enforce client-side role and state synchronization checks (UI export authorization)
  if (!isAdmin || !adminRole || !activeRoleRef || !activeUserId || adminRole !== activeRoleRef) {
    return {
      ok: false,
      error: 'Access denied: You must be an authenticated administrator or editor to export data.'
    };
  }

  const isFullAdmin = adminRole === 'admin' && activeRoleRef === 'admin';

  const exportPayload: Record<string, unknown> = {
    ...baseData,
    exportType: isFullAdmin ? 'full_administrative' : 'public_content',
    exportedAt: new Date().toISOString(),
  };

  if (isFullAdmin && sensitiveData) {
    exportPayload.enquiries = sensitiveData.enquiries || [];
    exportPayload.registrations = sensitiveData.registrations || [];
  }

  const filename = isFullAdmin
    ? `readers-of-aurangabad-full-backup-${timestamp}.json`
    : `readers-of-aurangabad-content-backup-${timestamp}.json`;

  return {
    ok: true,
    exportPayload,
    filename
  };
}
