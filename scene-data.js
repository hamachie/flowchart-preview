/* =============================================================================
   FIU OPERATIONS MAP — SCENE DATA  (real GHL source of truth)
   -----------------------------------------------------------------------------
   Nested tree of "scenes". Any node with a `child` id zooms into that sub-scene.

   NODE fields
     id, x, y, w, h          position + size in the scene's coordinate space
     tone                    'spine' | 'entry' | 'decision' | 'store' | 'system' | 'audience'
     kind, title, sub        labels on the card
     child                   (opt) scene id this node zooms into
     url                     (opt) public URL
     ghl                     (opt) GoHighLevel preview link
     tag                     (opt) the tag/state the step writes
     note                    (opt) operational note
     info                    (opt) { meaning, front:[], back:[] } richer panel copy

   EDGE  { from, to, type:'flow'|'branch', label? }
   ============================================================================= */

(function () {
  const G = "https://app.gohighlevel.com/v2/preview/";
  const KAJABI_LOGIN = "https://financialincrease.mykajabi.com/login";

  window.FIU = {
    meta: {
      title: "Financial Increase",
      subtitle: "Operations Map — funnels, products, automations & access",
      rootScene: "root",
    },

    scenes: {
      /* -------------------------------------------------------------------- */
      /* ROOT                                                                 */
      /* -------------------------------------------------------------------- */
      root: {
        title: "Operations Map",
        kicker: "financialincrease.com",
        w: 1640,
        h: 1560,
        nodes: [
          { id: "aud-visitor", x: 70, y: 150, w: 300, h: 96, tone: "audience", kind: "Audience", title: "Website Visitor", sub: "Organic, direct, referral, or ad traffic",
            info: { meaning: "Cold and warm traffic landing on the public site. The homepage decides where they go next.", front: ["Arrives on financialincrease.com from search, social, email, or ads.", "Becomes a GHL contact only once a form or checkout is started."] } },
          { id: "aud-member", x: 70, y: 282, w: 300, h: 96, tone: "audience", kind: "Audience", title: "Returning Member", sub: "Wants login, dashboard, or support",
            info: { meaning: "An existing customer returning for access rather than a new purchase.", front: ["Heads for login or a member resource link.", "Routed to Kajabi; access depends on existing entitlement state."] } },
          { id: "aud-team", x: 70, y: 414, w: 300, h: 96, tone: "audience", kind: "Audience", title: "Internal Team", sub: "Edits site, funnels, products, automations",
            info: { meaning: "FIU staff maintaining the site, GHL funnels, products, and automations.", back: ["Changes ripple into every customer path — coordinate product, tag, and workflow edits."] } },

          { id: "home-root", x: 600, y: 150, w: 400, h: 116, tone: "spine", kind: "Root", title: "Home Website", sub: "financialincrease.com — public tree root",
            url: "https://financialincrease.com", ghl: G + "HzSdqlRZtTWPrCCKk0xP",
            info: { meaning: "The homepage is the single public root. Every journey starts here and branches by intent.", front: ["Hero, sections, proof, navigation, CTA blocks.", "Links to information, login, or a product funnel."] } },
          { id: "home-browse", x: 620, y: 312, w: 360, h: 104, tone: "spine", kind: "Process", title: "Browse & Navigate", sub: "Explore content, proof, and offers",
            info: { meaning: "The pre-decision browsing layer where a visitor forms intent. No automations fire here." } },
          { id: "home-choice", x: 712, y: 470, w: 176, h: 176, tone: "decision", kind: "Decision", title: "Choose Path", sub: "Browse · Log in · Funnel",
            info: { meaning: "The fork where the homepage splits into journeys. Checkout only begins after a path is chosen." } },
          { id: "path-funnel", x: 620, y: 730, w: 360, h: 104, tone: "spine", kind: "Process", title: "Funnel / Offer Page", sub: "Book, course, LIVE, Velocity, event",
            info: { meaning: "The selected funnel landing or offer page — the real start of a sale. Maps to a specific GHL funnel + product." } },
          { id: "path-checkout", x: 620, y: 880, w: 360, h: 104, tone: "spine", kind: "Process", title: "Checkout / Form / Booking", sub: "Buying starts here — not on the homepage",
            info: { meaning: "Where payment, form submission, or booking happens. Creates / updates the GHL contact and order record." } },
          { id: "path-purchase", x: 620, y: 1030, w: 360, h: 120, tone: "store", kind: "Data Store", title: "GHL Contact + Purchase Record", sub: "Product · price · tag · order · form state", child: "entitlements",
            info: { meaning: "The system of record. Everything downstream keys off the tags written here. Zoom in for the tag model." } },
          { id: "path-router", x: 620, y: 1196, w: 360, h: 104, tone: "spine", kind: "Process", title: "Automation Router", sub: "Workflow · webhook · redirect · fulfillment",
            info: { meaning: "Reads purchase state and triggers the right systems immediately after purchase.", back: ["Confirm real GHL workflow names + webhook targets."] } },
          { id: "path-delivery", x: 620, y: 1346, w: 360, h: 104, tone: "spine", kind: "Process", title: "Access & Delivery", sub: "Kajabi · Telegram · PDF · dashboard · shipping", child: "delivery",
            info: { meaning: "Where the customer receives what they bought. Zoom in for the delivery matrix." } },

          { id: "br-hero", x: 1130, y: 150, w: 420, h: 96, tone: "entry", kind: "Entry", title: "Homepage CTA Blocks", sub: "Primary product entry points",
            info: { meaning: "The homepage CTAs that send visitors into specific funnels. Pure navigation." } },
          { id: "br-books", x: 1130, y: 268, w: 420, h: 96, tone: "entry", kind: "Funnel", title: "Book Offer Paths", sub: "digitalbook · hardcover · books", child: "books" },
          { id: "br-courses", x: 1130, y: 386, w: 420, h: 96, tone: "entry", kind: "Funnel", title: "Course Offer Paths", sub: "coursecheckout · moneyreset", child: "courses" },
          { id: "br-membership", x: 1130, y: 504, w: 420, h: 96, tone: "entry", kind: "Funnel", title: "Membership Paths", sub: "membership · trial · onboarding", child: "membership" },
          { id: "br-velocity", x: 1130, y: 622, w: 420, h: 96, tone: "entry", kind: "Funnel", title: "Velocity Paths", sub: "unlock · sales · checkout · calendar", child: "velocity" },
          { id: "br-resources", x: 1130, y: 740, w: 420, h: 96, tone: "entry", kind: "Utility", title: "Resource / Utility Paths", sub: "advisors · affiliate · church · events", child: "resources" },
          { id: "br-login", x: 1130, y: 858, w: 420, h: 96, tone: "system", kind: "Redirect", title: "Login Redirect", sub: "financialincrease.com/login → Kajabi", child: "login" },

          { id: "sys-site", x: 1130, y: 1030, w: 200, h: 96, tone: "system", kind: "System", title: "Site Backend", sub: "Builder, source, page updates",
            info: { meaning: "Where the public site is edited — separate from GHL funnel editing." } },
          { id: "sys-ghl", x: 1400, y: 1030, w: 200, h: 96, tone: "system", kind: "System", title: "GHL Backend", sub: "Funnels, products, forms, tags",
            info: { meaning: "The commerce + CRM engine behind every funnel. Tags, workflows, and webhooks live here." } },
        ],
        edges: [
          { from: "aud-visitor", to: "home-root", type: "branch" },
          { from: "aud-member", to: "home-root", type: "branch" },
          { from: "aud-team", to: "home-root", type: "branch" },
          { from: "home-root", to: "home-browse", type: "flow" },
          { from: "home-browse", to: "home-choice", type: "flow" },
          { from: "home-choice", to: "path-funnel", type: "flow", label: "enter funnel" },
          { from: "path-funnel", to: "path-checkout", type: "flow" },
          { from: "path-checkout", to: "path-purchase", type: "flow" },
          { from: "path-purchase", to: "path-router", type: "flow" },
          { from: "path-router", to: "path-delivery", type: "flow" },
          { from: "home-browse", to: "br-hero", type: "branch" },
          { from: "home-choice", to: "br-books", type: "branch" },
          { from: "home-choice", to: "br-courses", type: "branch" },
          { from: "home-choice", to: "br-membership", type: "branch" },
          { from: "home-choice", to: "br-velocity", type: "branch" },
          { from: "home-choice", to: "br-resources", type: "branch" },
          { from: "home-choice", to: "br-login", type: "branch", label: "log in" },
          { from: "home-root", to: "sys-site", type: "branch" },
          { from: "path-funnel", to: "sys-ghl", type: "branch" },
          { from: "path-router", to: "sys-ghl", type: "branch" },
        ],
      },

      /* -------------------------------------------------------------------- */
      /* ENTITLEMENTS                                                         */
      /* -------------------------------------------------------------------- */
      entitlements: {
        title: "Entitlement & Access Model", kicker: "tags · access · sequences", w: 1800, h: 840,
        nodes: [
          { id: "ent-record", x: 60, y: 330, w: 240, h: 140, tone: "store", kind: "Data Store", title: "Purchase Record", sub: "Order · product · price · form",
            info: { meaning: "The order written at checkout. Every tag below is derived from it." } },
          { id: "ent-trigger", x: 360, y: 330, w: 260, h: 140, tone: "spine", kind: "Automation", title: "Automation Trigger", sub: "GHL Form → Tag → Zap → Kajabi",
            info: { meaning: "The common automation pattern across products: a GHL form fires a tag, a Zap relays it to Kajabi, which grants access and sends the welcome email.", back: ["All welcome emails send FROM Kajabi.", "Confirm Zap names / webhook targets."] } },

          // ---- Purchases (with welcome sequences) — column A ----
          { id: "ent-fiu-course", x: 680, y: 40, w: 320, h: 150, tone: "system", kind: "Purchase Tag", title: "FIU Course (Lifetime)", sub: "Solo course purchase",
            tag: "Purchased FIU Course (Lifetime)",
            info: { back: ["Access: Financial Increase University", "Email: FIU Course Welcome (from Kajabi)", "Trigger: GHL Form → Tag → Zap → Kajabi", "Upsell path: bought course but NOT FIU LIVE"] } },
          { id: "ent-fiu-live", x: 680, y: 220, w: 320, h: 150, tone: "system", kind: "Purchase Tag", title: "FIU LIVE (Active)", sub: "Solo membership purchase",
            tag: "Purchased FIU LIVE (Active)",
            info: { back: ["Access: Financial Increase LIVE", "Email: FIU LIVE Access Welcome (from Kajabi)", "Trigger: GHL Form → Tag → Zap → Kajabi"] } },
          { id: "ent-hard-bundle", x: 680, y: 400, w: 320, h: 150, tone: "system", kind: "Purchase Tag", title: "Hardcover Bundle", sub: "Book + bonuses",
            tag: "Purchased Hardcover Bundle - Book Purchase",
            info: { back: ["Access: Ship Zoom shipment → Audio Book → Event Guest Pass", "Email: Hardcover Bundle Book — Welcome (from GHL)", "Trigger: GHL Form → Tag → Zap → Kajabi", "Upsell path: bought book but NOT FIU Course", "TODO: add digital copy on TY page + email"] } },
          { id: "ent-digital-bundle", x: 680, y: 580, w: 320, h: 150, tone: "system", kind: "Purchase Tag", title: "Digital Bundle", sub: "Book + bonuses",
            tag: "Purchased Digital Bundle - Book Purchase",
            info: { back: ["Access: Audio Book → Event Guest Pass", "Email: Digital Bundle Book — Welcome (from GHL)", "Trigger: GHL Form → Tag → Zap → Kajabi", "Upsell path: bought book + course but NOT membership", "TODO: add digital copy on TY page + email"] } },

          // ---- Purchases — column B ----
          { id: "ent-reset", x: 1040, y: 40, w: 320, h: 150, tone: "system", kind: "Purchase Tag", title: "Money-Mind Reset", sub: "Course + Summit",
            tag: "Purchased Money-Mind Reset Course",
            info: { back: ["Access: Money-Mind Reset → Event Guest Pass", "Email: Money-Mind Reset Welcome (from GHL)", "Trigger: GHL Form → Tag → Zap → Kajabi", "Upsell path: bought course but NOT FIU; bought FIU but NOT membership"] } },
          { id: "ent-audio", x: 1040, y: 220, w: 320, h: 150, tone: "system", kind: "Purchase Tag", title: "Audio Book", sub: "180 Inner-Game audio",
            tag: "Audio Book Access",
            info: { back: ["Access: The 180 Inner-Game Shifts Audio Book", "Email: Audio Book Welcome (from Kajabi)", "Trigger: GHL Form → Tag → Zap → Kajabi"] } },
          { id: "ent-hard-solo", x: 1040, y: 400, w: 320, h: 150, tone: "system", kind: "Purchase Tag", title: "Hardcover (Solo)", sub: "Direct book checkout",
            tag: "Purchased Hardcover Book (Solo)",
            info: { back: ["Access: forward shipping address → support@financialincrease.com", "Email: Your Book is On the Way (from GHL)", "Trigger: GHL Form → Tag → forward shipping to support"] } },
          { id: "ent-velocity", x: 1040, y: 580, w: 320, h: 150, tone: "system", kind: "Purchase Tag", title: "Velocity", sub: "Top-tier bundle",
            tag: "Velocity Purchased",
            info: { back: ["Access: LIVE bundle — Kajabi + Velocity Telegram + dashboard", "Suppress lower-tier promo sequences."] } },

          // ---- Upsells (no sequence — just access) — column C ----
          { id: "ent-up-course", x: 1400, y: 40, w: 320, h: 150, tone: "store", kind: "Upsell Tag", title: "Upsell · FIU Course", sub: "No sequence — just access",
            tag: "Purchased Upsell to FIU Course", info: { back: ["Access: Financial Increase University", "No email sequence — access only"] } },
          { id: "ent-up-live", x: 1400, y: 220, w: 320, h: 150, tone: "store", kind: "Upsell Tag", title: "Upsell · FIU LIVE", sub: "No sequence — just access",
            tag: "Purchased Upsell to FIU LIVE (Active)", info: { back: ["Access: Financial Increase LIVE", "No email sequence — access only"] } },
          { id: "ent-up-trial", x: 1400, y: 400, w: 320, h: 150, tone: "store", kind: "Upsell Tag", title: "Upsell · LIVE Trial", sub: "No sequence — just access",
            tag: "Purchase Upsell FIU LIVE Trial (Active)", info: { back: ["Access: Financial Increase LIVE", "No email sequence — access only"] } },
          { id: "ent-up-hard", x: 1400, y: 580, w: 320, h: 150, tone: "store", kind: "Upsell Tag", title: "Upsell · Hardcover", sub: "Trigger Ship Zoom only",
            tag: "Purchased Upsell to Hardcover Book", info: { back: ["Access: trigger Ship Zoom shipment", "No email sequence"] } },

          // ---- Lists ----
          { id: "ent-waitlist", x: 60, y: 540, w: 240, h: 130, tone: "audience", kind: "List", title: "Waitlist", sub: "Joined membership waitlist", tag: "FIU Waitlist" },
          { id: "ent-general", x: 60, y: 700, w: 240, h: 130, tone: "audience", kind: "List", title: "General List", sub: "After any campaign ends", tag: "FIU General List" },
        ],
        edges: [
          { from: "ent-record", to: "ent-trigger", type: "flow" },
          { from: "ent-trigger", to: "ent-fiu-course", type: "branch" },
          { from: "ent-trigger", to: "ent-fiu-live", type: "branch" },
          { from: "ent-trigger", to: "ent-hard-bundle", type: "branch" },
          { from: "ent-trigger", to: "ent-digital-bundle", type: "branch" },
          { from: "ent-trigger", to: "ent-reset", type: "branch" },
          { from: "ent-trigger", to: "ent-audio", type: "branch" },
          { from: "ent-trigger", to: "ent-hard-solo", type: "branch" },
          { from: "ent-trigger", to: "ent-velocity", type: "branch" },
          { from: "ent-trigger", to: "ent-up-course", type: "branch" },
          { from: "ent-trigger", to: "ent-up-live", type: "branch" },
          { from: "ent-trigger", to: "ent-up-trial", type: "branch" },
          { from: "ent-trigger", to: "ent-up-hard", type: "branch" },
          { from: "ent-record", to: "ent-waitlist", type: "branch" },
          { from: "ent-record", to: "ent-general", type: "branch" },
        ],
      },

      /* -------------------------------------------------------------------- */
      /* DELIVERY                                                             */
      /* -------------------------------------------------------------------- */
      delivery: {
        title: "Delivery Systems", kicker: "where access is granted", w: 1240, h: 920,
        nodes: [
          { id: "del-router", x: 60, y: 400, w: 250, h: 120, tone: "spine", kind: "Process", title: "Delivery Router", sub: "Maps entitlement → systems",
            info: { meaning: "Routes each entitlement to the correct delivery system.", back: ["Pattern: GHL Form → Tag → Zap → Kajabi grants access + sends welcome email.", "Confirm Zap names / webhook targets."] } },
          { id: "del-kajabi", x: 430, y: 40, w: 320, h: 92, tone: "system", kind: "System", title: "Kajabi", sub: "Courses + LIVE access + welcome emails",
            url: "https://financialincrease.mykajabi.com", info: { back: ["Grant on FIU, Money-Mind Reset, LIVE, Velocity.", "All welcome email sequences send from Kajabi."] } },
          { id: "del-telegram", x: 430, y: 146, w: 320, h: 92, tone: "system", kind: "System", title: "Telegram", sub: "LIVE · Messenger · Velocity channels",
            info: { back: ["LIVE: t.me/+jpK3koebWKQzOTlh", "Messenger: t.me/+6DTLCB3MQ_diMGFh", "Velocity: t.me/+vfQtRVDqvD1iYmRh"] } },
          { id: "del-dashboard", x: 430, y: 252, w: 320, h: 92, tone: "system", kind: "System", title: "Dashboard", sub: "Portfolio + member tools",
            info: { back: ["Provision on LIVE + Velocity."] } },
          { id: "del-pdf", x: 430, y: 358, w: 320, h: 92, tone: "system", kind: "System", title: "PDF / Digital Copy", sub: "Digital book fulfillment",
            url: "https://storage.googleapis.com/msgsndr/0wGj9IjNlSL307m4uy9Q/media/69441b4c1d327779dc849f7e.pdf", info: { back: ["Hosted on Google Cloud Storage.", "TODO: add digital copy on bundle thank-you pages + emails."] } },
          { id: "del-audio", x: 430, y: 464, w: 320, h: 92, tone: "system", kind: "System", title: "Audio Book", sub: "180 Inner-Game Shifts audio",
            info: { back: ["Granted on Digital + Hardcover bundles and standalone Audio Book purchase.", "Delivered via Kajabi."] } },
          { id: "del-event", x: 430, y: 570, w: 320, h: 92, tone: "system", kind: "System", title: "Event Guest Pass", sub: "Bundled event access",
            info: { back: ["Granted on book bundles + Money-Mind Reset.", "Separate from paid Summit tickets."] } },
          { id: "del-ship", x: 430, y: 676, w: 320, h: 92, tone: "system", kind: "System", title: "Ship Zoom + Support", sub: "Hardcover shipping · church · follow-up",
            info: { back: ["Hardcover bundle → trigger Ship Zoom shipment.", "Solo hardcover → forward address to support@financialincrease.com.", "Support: Adam@ / support@financialincrease.com"] } },
          { id: "del-summit", x: 430, y: 782, w: 320, h: 92, tone: "system", kind: "System", title: "Summit Tickets", sub: "Money-Mind bundled entitlement",
            info: { back: ["2 tickets bundled with Money-Mind Reset. Track so buyers aren't re-sold."] } },
          { id: "del-next", x: 870, y: 400, w: 290, h: 120, tone: "spine", kind: "Process", title: "Thank-You + Next", sub: "Onboarding · upsell · retention" },
        ],
        edges: [
          { from: "del-router", to: "del-kajabi", type: "flow" },
          { from: "del-router", to: "del-telegram", type: "branch" },
          { from: "del-router", to: "del-dashboard", type: "branch" },
          { from: "del-router", to: "del-pdf", type: "branch" },
          { from: "del-router", to: "del-audio", type: "branch" },
          { from: "del-router", to: "del-event", type: "branch" },
          { from: "del-router", to: "del-ship", type: "branch" },
          { from: "del-router", to: "del-summit", type: "branch" },
          { from: "del-kajabi", to: "del-next", type: "branch" },
        ],
      },

      /* -------------------------------------------------------------------- */
      /* BOOKS                                                                */
      /* -------------------------------------------------------------------- */
      books: {
        title: "Book Offer Paths", kicker: "180 Inner-Game Shifts", w: 1260, h: 700,
        nodes: [
          { id: "bk-buyer", x: 50, y: 290, w: 230, h: 120, tone: "audience", kind: "Audience", title: "Book Buyer", sub: "Interested in 180 Inner-Game Shifts" },
          { id: "bk-entry", x: 330, y: 290, w: 250, h: 120, tone: "spine", kind: "Process", title: "Book Offer Entry", sub: "Homepage CTA, ads, or direct link" },
          { id: "bk-digital", x: 640, y: 110, w: 290, h: 116, tone: "entry", kind: "Funnel", title: "Digital Book Funnel", sub: "$4.99 + upsells", child: "books-digital" },
          { id: "bk-direct", x: 640, y: 290, w: 290, h: 116, tone: "system", kind: "Checkout", title: "Solo Hardcover Checkout", sub: "Direct route · /books",
            url: "https://financialincrease.com/books", ghl: G + "VwpQzc7eRFnROwlFWSIv",
            product: "Individual Book Checkout Page", tag: "Purchased Hardcover Book (Solo)",
            trigger: "GHL Form → Tag → forward shipping", access: "Ship to support@financialincrease.com", email: "Your Book is On the Way (from GHL)",
            note: "Order bump: FIU Course. Membership upsell → trial → onboarding → thankyou-2. Suppress: Bought Hardcover but NOT FIU Course." },
          { id: "bk-hardcover", x: 640, y: 470, w: 290, h: 116, tone: "entry", kind: "Funnel", title: "Hardcover Funnel", sub: "$39.99 + shipping path", child: "books-hardcover" },
          { id: "bk-outcome", x: 990, y: 280, w: 220, h: 140, tone: "spine", kind: "Process", title: "Thank-You + Fulfillment", sub: "Delivery, support, or next offer" },
        ],
        edges: [
          { from: "bk-buyer", to: "bk-entry", type: "flow" },
          { from: "bk-entry", to: "bk-digital", type: "flow" },
          { from: "bk-entry", to: "bk-direct", type: "branch" },
          { from: "bk-entry", to: "bk-hardcover", type: "flow" },
          { from: "bk-digital", to: "bk-outcome", type: "branch" },
          { from: "bk-direct", to: "bk-outcome", type: "branch" },
          { from: "bk-hardcover", to: "bk-outcome", type: "branch" },
        ],
      },

      "books-digital": {
        title: "Digital Book Funnel", kicker: "Marketing Funnel 1 · $4.99", w: 1440, h: 600,
        nodes: [
          { id: "d-landing", x: 40, y: 230, w: 250, h: 130, tone: "entry", kind: "Page", title: "Digital Book + Bonuses", sub: "$4.99 front-end offer",
            url: "https://financialincrease.com/digitalbook", ghl: G + "qOGz6tpGXQe5jmH3f63r?notrack=true",
            product: "FINANCIAL INCREASE UNI Digital book-MTZC", tag: "Purchased Digital Bundle - Book Purchase",
            trigger: "GHL Form → Tag → Zap → Kajabi", access: "Audio Book Access → Event Guest Pass", email: "Digital Bundle Book — Welcome (from GHL)",
            note: "Suppress: Bought Book but NOT Course. TODO: add digital copy on TY page + email." },
          { id: "d-buy", x: 320, y: 230, w: 200, h: 130, tone: "spine", kind: "Process", title: "Buy $4.99 Bundle", sub: "Low-ticket purchase" },
          { id: "d-bump1", x: 550, y: 40, w: 250, h: 120, tone: "system", kind: "Order Bump 1", title: "Hardcover Book", sub: "Solo hardcover add-on",
            tag: "Purchased Hardcover Book (Solo)", trigger: "GHL Tag → forward shipping", access: "Ship to support@financialincrease.com", email: "No sequence — just access" },
          { id: "d-bump2", x: 550, y: 175, w: 250, h: 120, tone: "system", kind: "Order Bump 2", title: "FIU Course", sub: "$99 special in checkout",
            tag: "Purchased Upsell to FIU Course", trigger: "GHL Tag → Zap → Kajabi", access: "Financial Increase University", email: "No sequence — just access" },
          { id: "d-live", x: 830, y: 60, w: 250, h: 116, tone: "entry", kind: "Upsell", title: "LIVE Membership Upsell", sub: "$67 / month",
            url: "https://financialincrease.com/FIU-Live-Invite", ghl: G + "yv5dDMlA61ZoOePw3Kqu?notrack=true",
            tag: "Purchased FIU LIVE (Active)", trigger: "GHL Tag → Zap → Kajabi", access: "FIU LIVE", email: "No sequence — just access",
            note: "Suppress: Bought Book and Course but NOT Membership." },
          { id: "d-trial", x: 830, y: 220, w: 250, h: 116, tone: "entry", kind: "Downsell", title: "LIVE Trial Downsell", sub: "$7 / 14-day trial",
            url: "https://financialincrease.com/trial", ghl: G + "5pG03nc48KDr28DwXFUU?notrack=true",
            tag: "Purchase FIU LIVE Trial (Active)", trigger: "GHL Tag → Zap → Kajabi", access: "FIU LIVE", email: "No sequence — just access" },
          { id: "d-onboard", x: 830, y: 380, w: 250, h: 116, tone: "spine", kind: "Booking", title: "Onboarding Calendar", sub: "Booking page",
            url: "https://financialincrease.com/onboarding", ghl: G + "kPGddsQDgrIZgYvZG6tf?notrack=true" },
          { id: "d-thanks", x: 1110, y: 230, w: 250, h: 130, tone: "spine", kind: "Process", title: "Thank-You + Delivery", sub: "PDF access",
            url: "https://financialincrease.com/thankyou-1", ghl: G + "53wVbc21ccWokgxbKPKn?notrack=true" },
        ],
        edges: [
          { from: "d-landing", to: "d-buy", type: "flow" },
          { from: "d-buy", to: "d-bump1", type: "branch" },
          { from: "d-buy", to: "d-bump2", type: "branch" },
          { from: "d-buy", to: "d-live", type: "flow" },
          { from: "d-live", to: "d-trial", type: "branch" },
          { from: "d-live", to: "d-onboard", type: "branch" },
          { from: "d-live", to: "d-thanks", type: "flow" },
          { from: "d-trial", to: "d-thanks", type: "branch" },
          { from: "d-onboard", to: "d-thanks", type: "branch" },
        ],
      },

      "books-hardcover": {
        title: "Hardcover Funnel", kicker: "Marketing Funnel 2 · $39.99", w: 1440, h: 600,
        nodes: [
          { id: "h-landing", x: 40, y: 230, w: 260, h: 130, tone: "entry", kind: "Page", title: "Hard Copy + Bonuses", sub: "$39.99 + tax & shipping",
            url: "https://financialincrease.com/hardcover", ghl: G + "AjNbPNltjmfSdT2PduIO",
            product: "FINANCIAL INCREASE UNI Physical book-MTZC", tag: "Purchased Hardcover Bundle - Book Purchase",
            trigger: "GHL Form → Tag → Zap → Kajabi", access: "Ship Zoom shipment → Audio Book → Event Guest Pass", email: "Hardcover Bundle Book — Welcome (from GHL)",
            note: "Ship Zoom notifies support@financialincrease.com. Suppress: Bought Book but NOT Course." },
          { id: "h-buy", x: 330, y: 230, w: 200, h: 130, tone: "spine", kind: "Process", title: "Buy Bundle", sub: "Hardcover purchase" },
          { id: "h-bump", x: 560, y: 60, w: 250, h: 120, tone: "system", kind: "Order Bump", title: "FIU Course", sub: "Checkout add-on",
            tag: "Purchased Upsell to FIU Course", trigger: "GHL Tag → Zap → Kajabi", access: "Financial Increase University" },
          { id: "h-invite", x: 560, y: 210, w: 250, h: 116, tone: "entry", kind: "Upsell", title: "LIVE Invite", sub: "Membership upsell",
            url: "https://financialincrease.com/fiu-live-invite-hardcover", ghl: G + "Yk4SHRqoQsa2Rg9BKQzp?notrack=true",
            tag: "Purchased FIU LIVE (Active)", trigger: "GHL Tag → Zap → Kajabi", access: "FIU LIVE" },
          { id: "h-trial", x: 560, y: 360, w: 250, h: 116, tone: "entry", kind: "Downsell", title: "Trial Downsell", sub: "LIVE trial",
            url: "https://financialincrease.com/trial-hardcover", ghl: G + "T0HIY2KDBv3RRn3IH3JP?notrack=true",
            tag: "Purchase FIU LIVE Trial (Active)", trigger: "GHL Tag → Zap → Kajabi", access: "FIU LIVE",
            note: "Suppress: Bought Book and Course but NOT Membership." },
          { id: "h-onboard", x: 840, y: 230, w: 250, h: 130, tone: "spine", kind: "Booking", title: "Onboarding Calendar", sub: "Booking page",
            url: "https://financialincrease.com/onboarding-hardcover", ghl: G + "MhSXR34quY797wsg08dH?notrack=true" },
          { id: "h-thanks", x: 1120, y: 230, w: 280, h: 130, tone: "spine", kind: "Process", title: "Thank-You + Shipping", sub: "Fulfillment",
            url: "https://financialincrease.com/thankyou-2", ghl: G + "cjXJhwBdVkN9XFII7Igl?notrack=true" },
        ],
        edges: [
          { from: "h-landing", to: "h-buy", type: "flow" },
          { from: "h-buy", to: "h-bump", type: "branch" },
          { from: "h-buy", to: "h-invite", type: "flow" },
          { from: "h-invite", to: "h-trial", type: "branch" },
          { from: "h-invite", to: "h-onboard", type: "flow" },
          { from: "h-trial", to: "h-onboard", type: "branch" },
          { from: "h-onboard", to: "h-thanks", type: "flow" },
        ],
      },

      /* -------------------------------------------------------------------- */
      /* COURSES                                                              */
      /* -------------------------------------------------------------------- */
      courses: {
        title: "Course Offer Paths", kicker: "FIU + Money-Mind Reset", w: 1180, h: 640,
        nodes: [
          { id: "c-buyer", x: 50, y: 260, w: 220, h: 120, tone: "audience", kind: "Audience", title: "Course Buyer", sub: "Interested in education offers" },
          { id: "c-entry", x: 320, y: 260, w: 240, h: 120, tone: "spine", kind: "Process", title: "Course Entry Point", sub: "Homepage CTA, ad, or link" },
          { id: "c-fiu", x: 620, y: 110, w: 290, h: 116, tone: "entry", kind: "Funnel", title: "FIU Course Path", sub: "Primary course checkout", child: "courses-fiu" },
          { id: "c-reset", x: 620, y: 400, w: 290, h: 116, tone: "entry", kind: "Funnel", title: "Money-Mind Reset", sub: "Mid-ticket + 2 Summit tickets", child: "courses-reset" },
          { id: "c-kajabi", x: 960, y: 250, w: 190, h: 140, tone: "system", kind: "System", title: "Kajabi Access", sub: "Course delivery",
            url: "https://financialincrease.mykajabi.com" },
        ],
        edges: [
          { from: "c-buyer", to: "c-entry", type: "flow" },
          { from: "c-entry", to: "c-fiu", type: "flow" },
          { from: "c-entry", to: "c-reset", type: "branch" },
          { from: "c-fiu", to: "c-kajabi", type: "flow" },
          { from: "c-reset", to: "c-kajabi", type: "branch" },
        ],
      },

      "courses-fiu": {
        title: "FIU Course Checkout", kicker: "primary + solo course path", w: 1400, h: 560,
        nodes: [
          { id: "f-checkout", x: 40, y: 210, w: 260, h: 130, tone: "entry", kind: "Page", title: "FIU Course Checkout", sub: "Solo online course checkout",
            url: "https://financialincrease.com/coursecheckout", ghl: G + "fXVyvRzfl3beoi3aeF1O",
            product: "Individual Course Checkout Page", tag: "Purchased FIU Course (Lifetime)",
            trigger: "GHL Form → Tag → Zap → Kajabi", access: "Financial Increase University", email: "FIU Course Welcome (from Kajabi)" },
          { id: "f-buy", x: 330, y: 210, w: 200, h: 130, tone: "spine", kind: "Process", title: "Course Purchase", sub: "Lifetime FIU ownership" },
          { id: "f-live", x: 560, y: 50, w: 250, h: 120, tone: "entry", kind: "Upsell", title: "Membership Upsell", sub: "FIU LIVE offer",
            url: "https://financialincrease.com/moneyreset-FIU-LIVE", ghl: G + "dHchAveVpeSsjlP4xYru",
            tag: "Purchased FIU LIVE (Active)", trigger: "GHL Tag → Zap → Kajabi", access: "FIU LIVE",
            note: "Suppress: Bought the Course but NOT the Membership." },
          { id: "f-trial", x: 560, y: 190, w: 250, h: 120, tone: "entry", kind: "Downsell", title: "Membership Downsell", sub: "LIVE trial",
            url: "https://financialincrease.com/trial", ghl: G + "5pG03nc48KDr28DwXFUU",
            tag: "Purchase FIU LIVE Trial (Active)", trigger: "GHL Tag → Zap → Kajabi", access: "FIU LIVE" },
          { id: "f-onboard", x: 560, y: 330, w: 250, h: 120, tone: "spine", kind: "Booking", title: "Onboarding Calendar", sub: "Booking page",
            url: "https://financialincrease.com/onboarding", ghl: G + "kPGddsQDgrIZgYvZG6tf" },
          { id: "f-access", x: 850, y: 60, w: 250, h: 116, tone: "system", kind: "System", title: "Kajabi Course Access", sub: "Grant FIU content",
            url: "https://financialincreaseuniversity.com/home-2/" },
          { id: "f-thanks", x: 850, y: 330, w: 250, h: 120, tone: "spine", kind: "Process", title: "Thank-You Page 2", sub: "Confirmation + next steps",
            url: "https://financialincrease.com/thankyou-2", ghl: G + "6NXDFpAvyIBEcBYWh7E7?notrack=true" },
        ],
        edges: [
          { from: "f-checkout", to: "f-buy", type: "flow" },
          { from: "f-buy", to: "f-live", type: "flow" },
          { from: "f-buy", to: "f-access", type: "branch" },
          { from: "f-live", to: "f-trial", type: "branch" },
          { from: "f-live", to: "f-onboard", type: "flow" },
          { from: "f-trial", to: "f-onboard", type: "branch" },
          { from: "f-onboard", to: "f-thanks", type: "flow" },
        ],
      },

      "courses-reset": {
        title: "Money-Mind Reset", kicker: "Marketing Funnel 3 · course + Summit", w: 1480, h: 600,
        nodes: [
          { id: "r-landing", x: 40, y: 230, w: 240, h: 130, tone: "entry", kind: "Page", title: "Reset Landing", sub: "Mid-ticket course",
            url: "https://financialincrease.com/moneyreset", ghl: G + "Ur0rWFMisFEAHSZ2mbfy",
            product: "Money Mind Reset Course", email: "Money-Mind Reset Welcome (from GHL)",
            note: "Suppress: Bought Money-Mind Reset but NOT Membership." },
          { id: "r-checkout", x: 310, y: 230, w: 210, h: 130, tone: "spine", kind: "Checkout", title: "Reset Checkout", sub: "Main sale step",
            url: "https://financialincrease.com/moneyreset-checkout", ghl: G + "mW09C5wlB3ZqjV2GNzfK",
            tag: "Purchased Money-Mind Reset Course", trigger: "GHL Form → Tag → Zap → Kajabi", access: "Money-Mind Reset (Event Guest Pass)" },
          { id: "r-bump1", x: 550, y: 40, w: 240, h: 110, tone: "system", kind: "Order Bump 1", title: "FIU Course", sub: "$197 add-on",
            product: "Financial Increase Course & Curriculum $197", tag: "Purchased Upsell to FIU Course", trigger: "GHL Tag → Zap → Kajabi", access: "Financial Increase University" },
          { id: "r-bump2", x: 550, y: 160, w: 240, h: 110, tone: "system", kind: "Order Bump 2", title: "Hard Copy Book", sub: "$39.99 add-on",
            product: "Premium Hard Copy (Full Color) $39.99", tag: "Purchased Hardcover Book (Solo)", trigger: "GHL Tag → forward shipping" },
          { id: "r-live", x: 820, y: 60, w: 240, h: 116, tone: "entry", kind: "Upsell", title: "Membership Upsell", sub: "FIU LIVE offer",
            url: "https://financialincrease.com/moneyreset-fiu-live", ghl: G + "dHchAveVpeSsjlP4xYru",
            tag: "Purchased FIU LIVE (Active)", trigger: "GHL Tag → Zap → Kajabi", access: "FIU LIVE" },
          { id: "r-trial", x: 820, y: 200, w: 240, h: 116, tone: "entry", kind: "Downsell", title: "Membership Downsell", sub: "LIVE trial",
            url: "https://financialincrease.com/trial", ghl: G + "5pG03nc48KDr28DwXFUU",
            tag: "Purchase FIU LIVE Trial (Active)", trigger: "GHL Tag → Zap → Kajabi", access: "FIU LIVE" },
          { id: "r-onboard", x: 820, y: 340, w: 240, h: 116, tone: "spine", kind: "Booking", title: "Onboarding", sub: "Calendar step",
            url: "https://financialincrease.com/onboarding", ghl: G + "kPGddsQDgrIZgYvZG6tf" },
          { id: "r-thanks", x: 1100, y: 230, w: 280, h: 130, tone: "spine", kind: "Process", title: "Thank-You Page 3", sub: "Kajabi + 2 Summit tickets",
            url: "https://financialincrease.com/thankyou-3", ghl: G + "Fr7TSpJIPTUGEzS80EOm" },
        ],
        edges: [
          { from: "r-landing", to: "r-checkout", type: "flow" },
          { from: "r-checkout", to: "r-bump1", type: "branch" },
          { from: "r-checkout", to: "r-bump2", type: "branch" },
          { from: "r-checkout", to: "r-live", type: "flow" },
          { from: "r-live", to: "r-trial", type: "branch" },
          { from: "r-live", to: "r-onboard", type: "flow" },
          { from: "r-trial", to: "r-onboard", type: "branch" },
          { from: "r-onboard", to: "r-thanks", type: "flow" },
        ],
      },

      /* -------------------------------------------------------------------- */
      /* MEMBERSHIP  (FIU LIVE)                                               */
      /* -------------------------------------------------------------------- */
      membership: {
        title: "FIU LIVE Membership", kicker: "$67/mo · $7 trial", w: 1420, h: 640,
        nodes: [
          { id: "m-buyer", x: 40, y: 270, w: 180, h: 120, tone: "audience", kind: "Audience", title: "Membership Buyer", sub: "Wants FIU LIVE access" },
          { id: "m-home", x: 250, y: 270, w: 200, h: 120, tone: "entry", kind: "Page", title: "FIU LIVE Home", sub: "Membership landing" },
          { id: "m-checkout", x: 490, y: 120, w: 240, h: 130, tone: "spine", kind: "Checkout", title: "LIVE Checkout", sub: "$67 / month",
            url: "https://financialincrease.com/membership", ghl: G + "NTc4RbIjA9uckzQGuCQh",
            product: "Individual Membership Checkout Page", tag: "Purchased FIU LIVE (Active)",
            trigger: "GHL Form → Tag → Zap → Kajabi", access: "Financial Increase LIVE", email: "FIU LIVE Welcome (from Kajabi)" },
          { id: "m-trial", x: 490, y: 400, w: 240, h: 130, tone: "entry", kind: "Trial", title: "Trial Checkout", sub: "$7 → $67/mo after 14 days",
            url: "https://financialincrease.com/membership-trial", ghl: G + "Nj9pTufvEAuHzPKOJjsZ?notrack=true",
            tag: "Purchase FIU LIVE Trial (Active)", trigger: "GHL Form → Tag → Zap → Kajabi", access: "Financial Increase LIVE", email: "FIU LIVE Welcome (from Kajabi)",
            note: "TODO: duplicate checkout to offer $7 / 14-day trial then $67/mo." },
          { id: "m-bump", x: 760, y: 270, w: 230, h: 120, tone: "system", kind: "Order Bump", title: "FIU Course", sub: "Checkout add-on",
            tag: "Purchased Upsell to FIU Course", trigger: "GHL Tag → Zap → Kajabi", access: "Financial Increase University" },
          { id: "m-onboard", x: 1020, y: 120, w: 200, h: 120, tone: "spine", kind: "Booking", title: "Onboarding", sub: "Booking page",
            url: "https://financialincrease.com/onboarding", ghl: G + "kPGddsQDgrIZgYvZG6tf" },
          { id: "m-thanks", x: 1020, y: 400, w: 200, h: 116, tone: "spine", kind: "Process", title: "Thank-You Page 2", sub: "Confirmation",
            url: "https://financialincrease.com/thankyou-2", ghl: G + "6NXDFpAvyIBEcBYWh7E7?notrack=true" },
          { id: "m-access", x: 1250, y: 270, w: 150, h: 120, tone: "system", kind: "System", title: "Member Access", sub: "Kajabi · Telegram · Dashboard",
            info: { back: ["LIVE active unlocks Kajabi + LIVE Telegram + dashboard. Keep trial / active / cancelled / rebill distinct."] } },
        ],
        edges: [
          { from: "m-buyer", to: "m-home", type: "flow" },
          { from: "m-home", to: "m-checkout", type: "flow" },
          { from: "m-home", to: "m-trial", type: "branch" },
          { from: "m-checkout", to: "m-bump", type: "branch" },
          { from: "m-trial", to: "m-bump", type: "branch" },
          { from: "m-checkout", to: "m-onboard", type: "flow" },
          { from: "m-onboard", to: "m-thanks", type: "flow" },
          { from: "m-thanks", to: "m-access", type: "branch" },
        ],
      },

      /* -------------------------------------------------------------------- */
      /* VELOCITY                                                             */
      /* -------------------------------------------------------------------- */
      velocity: {
        title: "Financial Velocity", kicker: "$2,500 or 4 × $750", w: 1380, h: 620,
        nodes: [
          { id: "v-optin", x: 40, y: 250, w: 220, h: 120, tone: "entry", kind: "Opt-In", title: "Velocity Opt-In", sub: "Unlock opt-in",
            url: "https://app.financialincrease.com/unlock-velocity", note: "New URL — replaces financialincrease.com/Velocity." },
          { id: "v-sales", x: 300, y: 250, w: 220, h: 120, tone: "entry", kind: "Page", title: "Velocity Sales Page", sub: "Top-tier offer",
            url: "https://app.financialincrease.com/velocity", note: "New URL — replaces financialincrease.com/Velocity-Unlocked." },
          { id: "v-pif", x: 580, y: 120, w: 250, h: 116, tone: "spine", kind: "Checkout", title: "Checkout — Pay in Full", sub: "$2,500 one-time",
            url: "https://financialincrease.com/velocity-checkout-page" },
          { id: "v-plan", x: 580, y: 360, w: 250, h: 116, tone: "spine", kind: "Checkout", title: "Checkout — Payment Plan", sub: "4 × $750",
            url: "https://financialincrease.com/velocity-checkout-page-4-payment" },
          { id: "v-thanks", x: 880, y: 250, w: 200, h: 120, tone: "spine", kind: "Process", title: "Velocity Thank-You", sub: "Purchase confirmation",
            tag: "Velocity Purchased" },
          { id: "v-calendar", x: 1130, y: 120, w: 210, h: 116, tone: "system", kind: "Booking", title: "Velocity Calendar", sub: "Onboarding call" },
          { id: "v-callthanks", x: 1130, y: 360, w: 210, h: 116, tone: "spine", kind: "Process", title: "Call Thank-You", sub: "Post-booking",
            url: "https://app.financialincrease.com/call-thankyou" },
          { id: "v-access", x: 880, y: 430, w: 200, h: 120, tone: "system", kind: "System", title: "LIVE Bundle Access", sub: "Kajabi · Velocity Telegram · Dashboard",
            info: { back: ["Velocity includes the LIVE bundle — unlock without separate lower-tier purchases.", "Velocity Telegram: t.me/+vfQtRVDqvD1iYmRh"] } },
        ],
        edges: [
          { from: "v-optin", to: "v-sales", type: "flow" },
          { from: "v-sales", to: "v-pif", type: "flow" },
          { from: "v-sales", to: "v-plan", type: "branch" },
          { from: "v-pif", to: "v-thanks", type: "flow" },
          { from: "v-plan", to: "v-thanks", type: "branch" },
          { from: "v-thanks", to: "v-calendar", type: "flow" },
          { from: "v-calendar", to: "v-callthanks", type: "flow" },
          { from: "v-thanks", to: "v-access", type: "branch" },
        ],
      },

      /* -------------------------------------------------------------------- */
      /* RESOURCES                                                            */
      /* -------------------------------------------------------------------- */
      resources: {
        title: "Resources & Utility", kicker: "advisors · affiliate · church · events", w: 1080, h: 720,
        nodes: [
          { id: "res-hub", x: 40, y: 270, w: 230, h: 150, tone: "spine", kind: "Hub", title: "Resource Hub", sub: "Supporting pages & programs" },
          { id: "res-advisors", x: 360, y: 70, w: 270, h: 110, tone: "entry", kind: "Directory", title: "Trusted Advisors", sub: "Tax · insurance · mortgage · legal …",
            url: "https://financialincrease.com/trustedadvisors",
            info: { meaning: "Advisor directory with category pages.", back: ["/categoryofadvisors (preview " + "CDdUwCb7QXFhFfr0aXIo)", "/trustedadvisors-taxplanning", "/trustedadvisors-insurance", "/trustedadvisors-mortgages", "/trustedadvisors-willsandtrusts", "/trustedadvisors-funding", "+ Legal, Credit Repair"] } },
          { id: "res-affiliate", x: 360, y: 210, w: 270, h: 110, tone: "entry", kind: "Program", title: "Affiliate Program", sub: "Messenger affiliate",
            url: "https://financialincrease.com/messenger", ghl: G + "Cz1Odj7WkLGKGPApjHGd", tag: "Fiu-affiliate",
            info: { back: ["Sign-up: /messenger-signup", "Sign-in: /messenger-signin", "Affiliate dashboard — backend mapping TBC."] } },
          { id: "res-church", x: 360, y: 350, w: 270, h: 110, tone: "entry", kind: "Funnel", title: "Church / Site License", sub: "Landing → form → checkout", child: "church" },
          { id: "res-workshop", x: 360, y: 490, w: 270, h: 110, tone: "entry", kind: "Funnel", title: "Event / Workshop", sub: "Promo INCREASEFREE", child: "workshop" },
          { id: "res-waitlist", x: 720, y: 70, w: 250, h: 110, tone: "system", kind: "Utility", title: "Waitlist", sub: "Membership waitlist",
            url: "https://financialincrease.com/waitlist", info: { back: ["Source: financialincreaseuniversity.com/membership/", "Join: /waitlist-join"] } },
          { id: "res-paperback", x: 720, y: 210, w: 250, h: 110, tone: "system", kind: "Utility", title: "Paperback", sub: "→ Amazon paperback",
            url: "https://financialincrease.com/paperback" },
          { id: "res-linktree", x: 720, y: 350, w: 250, h: 110, tone: "system", kind: "Utility", title: "Link Tree", sub: "Show-me hub",
            url: "https://financialincrease.com/show-me", ghl: G + "xVZzLFkYlZ3YIGpOtYJG?notrack=true" },
          { id: "res-onboard", x: 720, y: 490, w: 250, h: 110, tone: "system", kind: "Utility", title: "Onboarding Solo Call", sub: "Solo onboarding",
            url: "https://financialincrease.com/onboarding" },
        ],
        edges: [
          { from: "res-hub", to: "res-advisors", type: "branch" },
          { from: "res-hub", to: "res-affiliate", type: "branch" },
          { from: "res-hub", to: "res-church", type: "flow" },
          { from: "res-hub", to: "res-workshop", type: "flow" },
          { from: "res-hub", to: "res-waitlist", type: "branch" },
          { from: "res-hub", to: "res-paperback", type: "branch" },
          { from: "res-hub", to: "res-linktree", type: "branch" },
          { from: "res-hub", to: "res-onboard", type: "branch" },
        ],
      },

      church: {
        title: "Church / Site License", kicker: "Marketing Funnel 5", w: 1360, h: 540,
        nodes: [
          { id: "ch-landing", x: 40, y: 210, w: 230, h: 120, tone: "entry", kind: "Page", title: "Church Landing", sub: "Site license info",
            url: "https://financialincrease.com/church-access", ghl: G + "3BJMfvamuYEM3m3VytQH" },
          { id: "ch-form", x: 300, y: 210, w: 230, h: 120, tone: "spine", kind: "Form", title: "Church Form", sub: "Lead capture",
            url: "https://financialincrease.com/church-access-form", ghl: G + "IStnjettKvCRxLJ5q8g5?notrack=true", note: "Routes to Adam@ / support@financialincrease.com" },
          { id: "ch-checkout", x: 560, y: 210, w: 240, h: 120, tone: "spine", kind: "Checkout", title: "Site License Checkout", sub: "Purchase step",
            url: "https://financialincrease.com/site-license-checkout", ghl: G + "GLv6dFPnZ2jYz0EX5m4a" },
          { id: "ch-request", x: 830, y: 90, w: 240, h: 116, tone: "spine", kind: "Process", title: "Site License Request", sub: "Request thank-you",
            url: "https://financialincrease.com/site-license-request", ghl: G + "T92ucAeKrSbIODXlH5Tm" },
          { id: "ch-purchase", x: 830, y: 330, w: 240, h: 116, tone: "spine", kind: "Process", title: "Purchase Thank-You", sub: "Post-purchase",
            url: "https://financialincrease.com/church-purchase-thankyou" },
          { id: "ch-support", x: 1110, y: 210, w: 210, h: 120, tone: "system", kind: "System", title: "Support / Fulfillment", sub: "Adam@ · support@",
            info: { back: ["Form submissions route to Adam@financialincrease.com and support@financialincrease.com."] } },
        ],
        edges: [
          { from: "ch-landing", to: "ch-form", type: "flow" },
          { from: "ch-form", to: "ch-checkout", type: "flow" },
          { from: "ch-checkout", to: "ch-request", type: "flow" },
          { from: "ch-request", to: "ch-purchase", type: "branch" },
          { from: "ch-form", to: "ch-support", type: "branch" },
        ],
      },

      workshop: {
        title: "Event / Workshop", kicker: "Marketing Funnel 4 · promo INCREASEFREE", w: 1140, h: 480,
        nodes: [
          { id: "wk-landing", x: 40, y: 180, w: 240, h: 120, tone: "entry", kind: "Page", title: "Event Landing", sub: "Workshop registration",
            url: "https://financialincrease.com/live-workshop", ghl: G + "5UMFdouopqsybMTlfgIF" },
          { id: "wk-access", x: 310, y: 180, w: 240, h: 120, tone: "spine", kind: "Process", title: "Workshop Access", sub: "Registration",
            url: "https://app.financialincrease.com/workshop-access" },
          { id: "wk-confirm", x: 580, y: 180, w: 240, h: 120, tone: "spine", kind: "Process", title: "Confirmation", sub: "Workshop confirmation",
            url: "https://financialincrease.com/workshop-confirmation", ghl: G + "LqKeX7geu7Kc4Etvmprb?notrack=true" },
          { id: "wk-thanks", x: 850, y: 180, w: 250, h: 120, tone: "spine", kind: "Process", title: "Workshop Thank-You", sub: "Post-event",
            url: "https://app.financialincrease.com/workshop-thankyou" },
        ],
        edges: [
          { from: "wk-landing", to: "wk-access", type: "flow" },
          { from: "wk-access", to: "wk-confirm", type: "flow" },
          { from: "wk-confirm", to: "wk-thanks", type: "flow" },
        ],
      },

      /* -------------------------------------------------------------------- */
      /* LOGIN                                                                */
      /* -------------------------------------------------------------------- */
      login: {
        title: "Login Redirect", kicker: "course + membership login", w: 1080, h: 560,
        nodes: [
          { id: "l-member", x: 40, y: 220, w: 220, h: 116, tone: "audience", kind: "Audience", title: "Member / Student", sub: "Needs course or membership access" },
          { id: "l-main", x: 300, y: 100, w: 260, h: 110, tone: "entry", kind: "Page", title: "financialincrease.com/login", sub: "Main branded login",
            url: "https://financialincrease.com/login", note: "Redirecting → Kajabi login" },
          { id: "l-fiu", x: 300, y: 350, w: 260, h: 110, tone: "entry", kind: "Page", title: "FIU university login", sub: "financialincreaseuniversity.com/login",
            url: "https://financialincreaseuniversity.com/login", note: "Redirecting → Kajabi login" },
          { id: "l-redirect", x: 600, y: 220, w: 230, h: 116, tone: "spine", kind: "Process", title: "Redirect", sub: "No checkout or product step" },
          { id: "l-kajabi", x: 870, y: 220, w: 170, h: 116, tone: "system", kind: "System", title: "Kajabi Login", sub: "Shared auth destination", child: "login-kajabi",
            url: KAJABI_LOGIN },
        ],
        edges: [
          { from: "l-member", to: "l-main", type: "flow" },
          { from: "l-member", to: "l-fiu", type: "branch" },
          { from: "l-main", to: "l-redirect", type: "flow" },
          { from: "l-fiu", to: "l-redirect", type: "branch" },
          { from: "l-redirect", to: "l-kajabi", type: "flow" },
        ],
      },

      "login-kajabi": {
        title: "Kajabi Login Workflow", kicker: "auth destination", w: 1080, h: 540,
        nodes: [
          { id: "k-entry", x: 50, y: 210, w: 230, h: 120, tone: "system", kind: "System", title: "Kajabi Login Page", sub: "Shared destination", url: KAJABI_LOGIN },
          { id: "k-auth", x: 320, y: 210, w: 230, h: 120, tone: "spine", kind: "Process", title: "Authentication", sub: "Email · password · reset",
            info: { back: ["Kajabi owns the login session and member authentication."] } },
          { id: "k-area", x: 600, y: 60, w: 240, h: 116, tone: "system", kind: "System", title: "Member Area", sub: "Course / membership dashboard" },
          { id: "k-check", x: 600, y: 320, w: 240, h: 116, tone: "spine", kind: "Process", title: "Access Check", sub: "Correct product access?",
            info: { back: ["If purchase happened in GHL but access is missing, the GHL → Kajabi handoff is the checkpoint."] } },
        ],
        edges: [
          { from: "k-entry", to: "k-auth", type: "flow" },
          { from: "k-auth", to: "k-area", type: "flow" },
          { from: "k-auth", to: "k-check", type: "branch" },
        ],
      },
    },
  };
})();
