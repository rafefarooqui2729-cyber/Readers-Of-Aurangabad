import React from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * BookLoader - Premium realistic literary novel page-turning loader.
 *
 * Visual Features:
 * - Open hardcover novel with visible spine, central binding, and layered page edges.
 * - Warm cream paper (#FAF8F5 / #FBF7EE) with authentic printed novel typography.
 * - Smooth CSS 3D folding and curling page-turn animation.
 * - Coordinated specular highlight sweeps and under-page shadows for realistic depth.
 * - Elegant branding with Cormorant Garamond and Plus Jakarta Sans.
 * - Full accessible semantics and graceful prefers-reduced-motion static presentation.
 */

interface BookLoaderProps {
  fullScreen?: boolean;
}

export const BookLoader: React.FC<BookLoaderProps> = ({ fullScreen = false }) => {
  const shouldReduceMotion = useReducedMotion();

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF8F5] text-[#1C1B1A]'
    : 'min-h-[50vh] flex flex-col items-center justify-center text-[#1C1B1A] py-12';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Readers of Aurangabad"
      className={containerClasses}
    >
      <div className="roa-book-stage" aria-hidden="true">
        {/* Hardcover book base */}
        <div className="roa-book-cover">
          {/* Stacked paper edges on left and right */}
          <div className="roa-page-edge roa-page-edge-left" />
          <div className="roa-page-edge roa-page-edge-right" />

          {/* Under-page shadow for lifting and landing realism */}
          <div className="roa-under-shadow roa-under-shadow-right" />
          <div className="roa-under-shadow roa-under-shadow-left" />

          {/* Static left open page */}
          <div className="roa-page-static roa-page-static-left">
            <div className="roa-page-inner">
              <div className="roa-page-header">
                <span className="roa-chapter-num">CHAPTER III</span>
                <span className="roa-page-num">42</span>
              </div>
              <p className="roa-prose roa-first-paragraph">
                The morning light filtered through the ancient windowpanes, casting long amber shapes across the worn wooden floor. She opened the volume with gentle care, as if every printed sentence were an invitation to a quieter, more thoughtful world.
              </p>
              <p className="roa-prose">
                Aurangabad was waking in its measured rhythm outside the gates, but within these quiet pages, time moved only at the patient pace of ink on paper.
              </p>
            </div>
            <div className="roa-gutter-gradient roa-gutter-left" />
          </div>

          {/* Static right open page (visible beneath turning sheets) */}
          <div className="roa-page-static roa-page-static-right">
            <div className="roa-page-inner">
              <div className="roa-page-header">
                <span className="roa-page-num">43</span>
                <span className="roa-chapter-num">READERS OF MH20</span>
              </div>
              <p className="roa-prose">
                "Every honest book is an open doorway," he said, turning to the window where the morning breeze stirred the banyan leaves. "You need only the quiet courage to cross the threshold and let another mind speak to your own."
              </p>
              <p className="roa-prose">
                Here strangers gathered beneath the trees, united not by background or boundary, but by the quiet delight of an open chapter and an unhurried Sunday.
              </p>
            </div>
            <div className="roa-gutter-gradient roa-gutter-right" />
          </div>

          {/* 3D Animated Turning Leaves (Staggered) */}
          {!shouldReduceMotion && (
            <>
              {/* Leaf 1 */}
              <div className="roa-turning-leaf roa-leaf-1">
                <div className="roa-leaf-face roa-leaf-front">
                  <div className="roa-page-inner">
                    <div className="roa-page-header">
                      <span className="roa-page-num">45</span>
                      <span className="roa-chapter-num">READERS OF AURANGABAD</span>
                    </div>
                    <p className="roa-prose">
                      Between the lines lived truths too delicate for noisy conversation, wrapped in cadence and rhythm like raw silk around glass. She marked the passage with a ribbon and paused to listen.
                    </p>
                    <p className="roa-prose">
                      A city is built of stone and history, but its soul is made of the stories its people choose to remember and share together.
                    </p>
                  </div>
                  <div className="roa-paper-curl-overlay" />
                </div>
                <div className="roa-leaf-face roa-leaf-back">
                  <div className="roa-page-inner">
                    <div className="roa-page-header">
                      <span className="roa-chapter-num">COMMUNITY</span>
                      <span className="roa-page-num">44</span>
                    </div>
                    <p className="roa-prose">
                      He walked slowly between the tall shelves, trailing a finger along cracked leather bindings. Each volume whispered of journeys postponed and of conversations waiting to begin.
                    </p>
                    <p className="roa-prose">
                      In the quiet margin someone had penciled a single word years ago: "remember." He smiled and turned the page with renewed wonder.
                    </p>
                  </div>
                  <div className="roa-paper-curl-overlay roa-back-curl" />
                </div>
              </div>

              {/* Leaf 2 */}
              <div className="roa-turning-leaf roa-leaf-2">
                <div className="roa-leaf-face roa-leaf-front">
                  <div className="roa-page-inner">
                    <div className="roa-page-header">
                      <span className="roa-page-num">47</span>
                      <span className="roa-chapter-num">GATHERINGS</span>
                    </div>
                    <p className="roa-prose">
                      The circle of readers sat together in companionable silence, strangers united by the simple joy of an open book and the shade of the ancient garden trees.
                    </p>
                    <p className="roa-prose">
                      No boundaries of religion, language, or age could divide the quiet fellowship that books naturally create when people read side by side.
                    </p>
                  </div>
                  <div className="roa-paper-curl-overlay" />
                </div>
                <div className="roa-leaf-face roa-leaf-back">
                  <div className="roa-page-inner">
                    <div className="roa-page-header">
                      <span className="roa-chapter-num">OUR STORY</span>
                      <span className="roa-page-num">46</span>
                    </div>
                    <p className="roa-prose">
                      Twilight softened the city skyline, painting the horizon in shades of warm amber and slate. One by one, the books gently closed, yet the conversations stayed alive.
                    </p>
                    <p className="roa-prose">
                      A silent reading hour had ended, but a community had found its voice in the heart of Aurangabad.
                    </p>
                  </div>
                  <div className="roa-paper-curl-overlay roa-back-curl" />
                </div>
              </div>

              {/* Leaf 3 */}
              <div className="roa-turning-leaf roa-leaf-3">
                <div className="roa-leaf-face roa-leaf-front">
                  <div className="roa-page-inner">
                    <div className="roa-page-header">
                      <span className="roa-page-num">49</span>
                      <span className="roa-chapter-num">THE JOURNAL</span>
                    </div>
                    <p className="roa-prose">
                      Ink pressed into paper carries more than mere words; it preserves the heartbeat of a community and the dreams of minds striving for understanding.
                    </p>
                    <p className="roa-prose">
                      We read not to escape our reality, but to return to it with clearer eyes, deeper empathy, and a quieter heart.
                    </p>
                  </div>
                  <div className="roa-paper-curl-overlay" />
                </div>
                <div className="roa-leaf-face roa-leaf-back">
                  <div className="roa-page-inner">
                    <div className="roa-page-header">
                      <span className="roa-chapter-num">REFLECTIONS</span>
                      <span className="roa-page-num">48</span>
                    </div>
                    <p className="roa-prose">
                      She placed the volume gently back on the table. The world had not shifted on its axis, but she had changed, and that made all the difference in the world.
                    </p>
                    <p className="roa-prose">
                      The lamplight flickered softly as the last reader took their leave, leaving the shelves in peaceful slumber until the morning.
                    </p>
                  </div>
                  <div className="roa-paper-curl-overlay roa-back-curl" />
                </div>
              </div>
            </>
          )}

          {/* Centre binding and spine */}
          <div className="roa-book-spine" />
          <div className="roa-bookmark-ribbon" />
        </div>
      </div>

      {/* Brand Labeling */}
      <div className="roa-branding select-none text-center mt-6">
        <h2 className="roa-branding-title">Readers of Aurangabad</h2>
        <p className="roa-branding-subtitle">A space for readers.</p>
      </div>

      {/* Scoped CSS Styles */}
      <style>{`
        /* ─── 3D Perspective Stage ─── */
        .roa-book-stage {
          width: 360px;
          height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1500px;
          perspective-origin: 50% 45%;
        }

        /* ─── Hardcover Book Base ─── */
        .roa-book-cover {
          position: relative;
          width: 330px;
          height: 215px;
          background: #2E251B;
          border-radius: 5px;
          transform-style: preserve-3d;
          transform: rotateX(10deg);
          box-shadow:
            0 16px 36px -6px rgba(28, 27, 26, 0.28),
            0 6px 14px -2px rgba(28, 27, 26, 0.18),
            inset 0 0 0 1px rgba(184, 139, 74, 0.35);
        }

        /* ─── Layered Stacked Page Edges ─── */
        .roa-page-edge {
          position: absolute;
          top: 6px;
          bottom: 6px;
          width: 154px;
          pointer-events: none;
          z-index: 1;
        }

        .roa-page-edge-left {
          left: 6px;
          border-radius: 4px 1px 1px 4px;
          background:
            repeating-linear-gradient(
              to bottom,
              #E5D9C4 0px,
              #FAF4E7 1.5px,
              #DFD1BA 3px
            );
          box-shadow:
            inset -3px 0 6px 0 rgba(69, 82, 64, 0.1),
            -2px 0 0 0 #D5C5AC,
            -4px 0 0 0 #C4B296;
        }

        .roa-page-edge-right {
          right: 6px;
          border-radius: 1px 4px 4px 1px;
          background:
            repeating-linear-gradient(
              to bottom,
              #E5D9C4 0px,
              #FAF4E7 1.5px,
              #DFD1BA 3px
            );
          box-shadow:
            inset 3px 0 6px 0 rgba(69, 82, 64, 0.1),
            2px 0 0 0 #D5C5AC,
            4px 0 0 0 #C4B296;
        }

        /* ─── Static Left & Right Pages ─── */
        .roa-page-static {
          position: absolute;
          top: 8px;
          bottom: 8px;
          width: 152px;
          background: linear-gradient(135deg, #FFFDF8 0%, #FAF5EA 60%, #F5EDE0 100%);
          border: 1px solid #E4DAC7;
          overflow: hidden;
          z-index: 2;
        }

        .roa-page-static-left {
          left: 8px;
          border-radius: 3px 1px 1px 3px;
          box-shadow: inset -10px 0 16px 0 rgba(70, 55, 35, 0.08);
        }

        .roa-page-static-right {
          right: 8px;
          border-radius: 1px 3px 3px 1px;
          box-shadow: inset 10px 0 16px 0 rgba(70, 55, 35, 0.08);
        }

        /* ─── Under-page Shadows for realistic lifting & landing ─── */
        .roa-under-shadow {
          position: absolute;
          top: 8px;
          bottom: 8px;
          width: 152px;
          z-index: 3;
          pointer-events: none;
        }

        .roa-under-shadow-right {
          right: 8px;
          border-radius: 1px 3px 3px 1px;
          animation: roaLiftShadow 3.3s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }

        .roa-under-shadow-left {
          left: 8px;
          border-radius: 3px 1px 1px 3px;
          animation: roaLandShadow 3.3s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }

        @keyframes roaLiftShadow {
          0%, 10% { opacity: 0; transform: scaleX(1); }
          22% { opacity: 0.35; background: linear-gradient(to left, rgba(40, 30, 15, 0.22), transparent 75%); }
          45% { opacity: 0.15; }
          65%, 100% { opacity: 0; }
        }

        @keyframes roaLandShadow {
          0%, 45% { opacity: 0; }
          60% { opacity: 0.25; background: linear-gradient(to right, rgba(40, 30, 15, 0.25), transparent 75%); }
          78% { opacity: 0.45; }
          90%, 100% { opacity: 0; }
        }

        /* ─── Page Inner Typography Content ─── */
        .roa-page-inner {
          padding: 10px 11px 8px 11px;
          height: 100%;
          display: flex;
          flex-direction: column;
          user-select: none;
        }

        .roa-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 5.5px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #B88B4A;
          text-transform: uppercase;
          border-bottom: 0.5px solid rgba(184, 139, 74, 0.3);
          padding-bottom: 3px;
          margin-bottom: 5px;
        }

        .roa-page-num {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 7px;
          font-weight: 600;
          color: #7A6F62;
        }

        .roa-prose {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 7.2px;
          line-height: 1.45;
          color: #2D2721;
          margin-bottom: 4px;
          text-align: justify;
          letter-spacing: 0.01em;
        }

        .roa-first-paragraph::first-letter {
          font-size: 13px;
          font-weight: 700;
          float: left;
          line-height: 0.9;
          margin-right: 2px;
          color: #455240;
          font-family: "Cormorant Garamond", Georgia, serif;
        }

        /* ─── Gutter Shadow Gradient ─── */
        .roa-gutter-gradient {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 24px;
          pointer-events: none;
          z-index: 4;
        }

        .roa-gutter-left {
          right: 0;
          background: linear-gradient(to right, transparent, rgba(50, 40, 25, 0.14));
        }

        .roa-gutter-right {
          left: 0;
          background: linear-gradient(to left, transparent, rgba(50, 40, 25, 0.14));
        }

        /* ─── Centre Binding and Spine ─── */
        .roa-book-spine {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 8px;
          transform: translateX(-50%);
          background: linear-gradient(
            90deg,
            #3A2C1D 0%,
            #7A5E3A 25%,
            #B88B4A 50%,
            #7A5E3A 75%,
            #3A2C1D 100%
          );
          border-radius: 1px;
          box-shadow:
            0 0 8px 0 rgba(0, 0, 0, 0.35),
            inset 0 0 2px 0 rgba(255, 255, 255, 0.25);
          z-index: 30;
        }

        .roa-bookmark-ribbon {
          position: absolute;
          top: -3px;
          left: calc(50% - 1.5px);
          width: 3px;
          height: 110%;
          background: linear-gradient(180deg, #8D5B4C 0%, #455240 100%);
          box-shadow: 1px 2px 4px 0 rgba(0, 0, 0, 0.3);
          border-radius: 1px;
          z-index: 31;
          pointer-events: none;
        }

        /* ─── Turning Leaf Physics & Keyframes ─── */
        .roa-turning-leaf {
          position: absolute;
          top: 8px;
          bottom: 8px;
          left: 50%;
          width: 152px;
          transform-origin: left center;
          transform-style: preserve-3d;
          z-index: 10;
          pointer-events: none;
          animation: roaPageTurn 3.3s cubic-bezier(0.38, 0.04, 0.22, 1) infinite;
        }

        .roa-leaf-1 {
          animation-delay: 0s;
          z-index: 13;
        }

        .roa-leaf-2 {
          animation-delay: 1.1s;
          z-index: 12;
        }

        .roa-leaf-3 {
          animation-delay: 2.2s;
          z-index: 11;
        }

        .roa-leaf-face {
          position: absolute;
          inset: 0;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border: 1px solid #DFD5C2;
        }

        .roa-leaf-front {
          border-radius: 1px 4px 4px 1px;
          background: linear-gradient(140deg, #FFFEFA 0%, #FAF5EA 65%, #F4ECE0 100%);
          box-shadow:
            2px 0 6px 0 rgba(50, 40, 25, 0.12),
            inset -6px 0 12px 0 rgba(70, 55, 35, 0.05);
        }

        .roa-leaf-back {
          transform: rotateY(180deg);
          border-radius: 4px 1px 1px 4px;
          background: linear-gradient(220deg, #FAF4E8 0%, #F5ECE0 65%, #EFE4D2 100%);
          box-shadow:
            -2px 0 6px 0 rgba(50, 40, 25, 0.1),
            inset 6px 0 12px 0 rgba(70, 55, 35, 0.06);
        }

        /* ─── Realistic Specular Curving Highlight & Travelling Shadow Overlay ─── */
        .roa-paper-curl-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            transparent 0%,
            transparent 25%,
            rgba(255, 255, 255, 0.65) 45%,
            rgba(255, 255, 255, 0.2) 55%,
            rgba(70, 50, 25, 0.12) 75%,
            transparent 100%
          );
          opacity: 0;
          animation: roaHighlightRoll 3.3s cubic-bezier(0.38, 0.04, 0.22, 1) infinite;
          animation-delay: inherit;
        }

        .roa-back-curl {
          background: linear-gradient(
            270deg,
            transparent 0%,
            transparent 25%,
            rgba(70, 50, 25, 0.16) 45%,
            rgba(255, 255, 255, 0.35) 65%,
            transparent 100%
          );
        }

        /* ─── Multi-Stage Page Turn Animation with Natural Curving & Folding ─── */
        @keyframes roaPageTurn {
          0%, 6% {
            transform: rotateY(0deg) skewY(0deg) scaleY(1) translateZ(0px);
            box-shadow: 2px 1px 6px rgba(45, 35, 20, 0.1);
          }
          15% {
            /* Outer edge lifts first, creating initial paper arch */
            transform: rotateY(-18deg) skewY(2deg) scaleY(0.985) translateZ(5px);
            box-shadow: 6px 3px 12px rgba(45, 35, 20, 0.16);
          }
          32% {
            /* Full bend and curved flexion toward viewer */
            transform: rotateY(-62deg) skewY(4deg) scaleY(0.965) translateZ(15px);
            box-shadow: 10px 8px 22px rgba(40, 30, 15, 0.22);
          }
          50% {
            /* Cresting vertically across the centre spine with arch reversal */
            transform: rotateY(-95deg) skewY(1deg) scaleY(0.96) translateZ(18px);
            box-shadow: 4px 10px 24px rgba(40, 30, 15, 0.2);
          }
          68% {
            /* Falling toward left stack with soft deceleration */
            transform: rotateY(-136deg) skewY(-3.5deg) scaleY(0.975) translateZ(12px);
            box-shadow: -6px 6px 16px rgba(40, 30, 15, 0.16);
          }
          82% {
            /* Fluttering gentle landing contact */
            transform: rotateY(-172deg) skewY(-0.8deg) scaleY(0.992) translateZ(3px);
            box-shadow: -3px 2px 8px rgba(40, 30, 15, 0.1);
          }
          90%, 100% {
            /* Resting smoothly on left stack */
            transform: rotateY(-180deg) skewY(0deg) scaleY(1) translateZ(0px);
            box-shadow: -1px 1px 4px rgba(40, 30, 15, 0.08);
          }
        }

        @keyframes roaHighlightRoll {
          0%, 8% { opacity: 0; }
          20% { opacity: 0.6; }
          40% { opacity: 0.95; }
          60% { opacity: 0.5; }
          75%, 100% { opacity: 0; }
        }

        /* ─── Editorial Brand Typography ─── */
        .roa-branding {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .roa-branding-title {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 26px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #1C1B1A;
          margin: 0;
        }

        .roa-branding-subtitle {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #77736D;
          margin: 0;
        }

        /* ─── Mobile Responsiveness ─── */
        @media (max-width: 480px) {
          .roa-book-stage {
            transform: scale(0.82);
            margin-bottom: -15px;
          }
          .roa-branding-title {
            font-size: 22px;
          }
          .roa-branding-subtitle {
            font-size: 10px;
          }
        }

        /* ─── Reduced Motion Support ─── */
        @media (prefers-reduced-motion: reduce) {
          .roa-turning-leaf {
            animation: none !important;
            display: none !important;
          }
          .roa-under-shadow {
            animation: none !important;
            opacity: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BookLoader;
