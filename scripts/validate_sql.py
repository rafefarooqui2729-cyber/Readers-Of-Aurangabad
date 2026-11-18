import re
import sys

def validate_file(filepath):
    print(f"\n==========================================")
    print(f"Validating SQL: {filepath}")
    print(f"==========================================")
    with open(filepath, 'r', encoding='utf-8') as f:
        sql = f.read()

    # 1. Check for invalid comma-separated policy syntax
    invalid_policy_matches = re.findall(r'for\s+([a-zA-Z_]+)\s*,\s*([a-zA-Z_]+)', sql)
    if invalid_policy_matches:
        print(f"ERROR: Found invalid comma-separated FOR clauses: {invalid_policy_matches}")
        return False
    else:
        print("[PASS] Zero comma-separated policy clauses found.")

    # 2. Check all CREATE POLICY statements
    policy_pattern = re.compile(r'create\s+policy\s+"([^"]+)"\s+on\s+([^\s]+)\s+for\s+([a-zA-Z_]+)', re.IGNORECASE)
    policies = policy_pattern.findall(sql)
    if policies:
        print(f"[PASS] Total policies declared: {len(policies)}")
        valid_cmds = {'select', 'insert', 'update', 'delete', 'all'}
        for name, table, cmd in policies:
            if cmd.lower() not in valid_cmds:
                print(f"ERROR: Invalid policy command '{cmd}' in policy '{name}' on {table}")
                return False
            print(f"  - [{cmd.upper()}] on {table}: \"{name}\"")

    # 3. Check for security definer functions search_path
    sec_defs = re.findall(r'create\s+(?:or\s+replace\s+)?function\s+([^\(]+)\(.*?\)\s+returns\s+[^;]+?security\s+definer\s+set\s+search_path\s*=\s*([^;]+);', sql, re.DOTALL | re.IGNORECASE)
    if sec_defs:
        print(f"\n[PASS] Total SECURITY DEFINER functions: {len(sec_defs)}")
        for fn, sp in sec_defs:
            clean_fn = fn.strip()
            clean_sp = sp.strip().replace('\n', ' ')
            print(f"  - Function '{clean_fn}' search_path: '{clean_sp}'")
            if ('public' not in clean_sp and 'pg_catalog' not in clean_sp) or 'pg_temp' not in clean_sp:
                print(f"WARNING: Function '{clean_fn}' does not have strict search path!")
                return False

    # 4. Check for unclosed single quotes or dollar quotes
    dollar_tags = re.findall(r'\$\$', sql)
    if len(dollar_tags) % 2 != 0:
        print(f"ERROR: Uneven dollar-quote tags count: {len(dollar_tags)}")
        return False
    if dollar_tags:
        print(f"[PASS] Dollar-quote tags balanced: {len(dollar_tags)} ($$ count is even).")

    return True

if __name__ == '__main__':
    all_ok = True
    target_files = [
        'supabase/migrations/202611090001_readers_of_aurangabad_production_schema.sql',
        'supabase/archive/migrations-not-for-local/202611090001_readers_of_aurangabad_production_schema_rollback.sql',
        'supabase/provision_authorized_accounts.sql',
        'supabase/snippets/verify_security_policies.sql',
        'supabase/tests/database/00001_security_policies.test.sql'
    ]
    for f in target_files:
        if not validate_file(f):
            all_ok = False

    if all_ok:
        print("\n=================================================================")
        print("ALL SQL FILES PASSED STATIC SYNTACTIC VALIDATION WITH ZERO ERRORS.")
        print("=================================================================")
        sys.exit(0)
    else:
        print("\nVALIDATION FAILED. SEE ERRORS ABOVE.")
        sys.exit(1)
