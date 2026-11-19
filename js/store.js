/* Ashlar demo data. All state stays in this browser. */
(function () {
  const DATA_KEY = "ashlar-demo-v1";
  const SESSION_KEY = "ashlar-session";

  function ago(hours) {
    return new Date(Date.now() - hours * 3600 * 1000).toISOString();
  }

  function createSeed() {
    const companies = [
      {
        id: "c_meridian",
        name: "Meridian Build Co.",
        trade: "General contractor",
        city: "Chicago",
        people: 180,
        founded: 2004,
        rating: 4.8,
        completed: 86,
        status: "active",
        createdAt: ago(24 * 400),
        about:
          "Meridian runs commercial work across the Chicago region, from core and shell through handover. The company posts trade projects and also takes on complete projects for other construction firms.",
        specialties: ["Commercial", "Healthcare", "Core & shell", "Interiors"],
        certifications: ["OSHA 30", "LEED AP", "Licensed general contractor"],
      },
      {
        id: "c_northline",
        name: "Northline Structures",
        trade: "Structural steel",
        city: "Milwaukee",
        people: 95,
        founded: 1998,
        rating: 4.7,
        completed: 64,
        status: "active",
        createdAt: ago(24 * 380),
        about:
          "Northline fabricates and erects structural steel for clinics, civic buildings, and industrial halls. Crews are set up for tight urban sites and winter schedules.",
        specialties: ["Structural steel", "Stairs", "Metal deck", "Erection"],
        certifications: ["AISC certified", "OSHA 30"],
      },
      {
        id: "c_harbor",
        name: "Harbor & Pine",
        trade: "Civil & site",
        city: "Chicago",
        people: 70,
        founded: 2011,
        rating: 4.6,
        completed: 41,
        status: "active",
        createdAt: ago(24 * 300),
        about:
          "Harbor & Pine builds site, utility, and waterfront civil work. They post their own projects and partner with general contractors on larger packages.",
        specialties: ["Sitework", "Utilities", "Waterfront", "Paving"],
        certifications: ["IDOT prequalified", "OSHA 30"],
      },
      {
        id: "c_apex",
        name: "Apex MEP Partners",
        trade: "Mechanical & electrical",
        city: "Detroit",
        people: 120,
        founded: 2008,
        rating: 4.9,
        completed: 73,
        status: "active",
        createdAt: ago(24 * 280),
        about:
          "Apex delivers mechanical, electrical, and plumbing projects for healthcare, schools, and commercial interiors. They prefer packages where coordination is part of the proposal.",
        specialties: ["Healthcare MEP", "Kitchens", "Controls", "Fit-out coordination"],
        certifications: ["Licensed mechanical", "Licensed electrical"],
      },
      {
        id: "c_vantage",
        name: "Vantage Interiors",
        trade: "Interior fit-out",
        city: "Chicago",
        people: 60,
        founded: 2014,
        rating: 4.8,
        completed: 52,
        status: "active",
        createdAt: ago(24 * 220),
        about:
          "Vantage runs interior fit-outs for offices and public spaces. The team phases occupied floors so public areas can open before the back of house is finished.",
        specialties: ["Office fit-out", "Occupied renovation", "Finishes", "Millwork coordination"],
        certifications: ["OSHA 30", "LEED AP"],
      },
      {
        id: "c_sable",
        name: "Sable Concrete Co.",
        trade: "Concrete",
        city: "Indianapolis",
        people: 140,
        founded: 1992,
        rating: 4.5,
        completed: 90,
        status: "active",
        createdAt: ago(24 * 500),
        about:
          "Sable self-performs structural concrete, decks, and repairs. Pumping plans and tight downtown sites are a regular part of the work.",
        specialties: ["Structural concrete", "Decks", "Repairs", "Flatwork"],
        certifications: ["ACI certified", "OSHA 30"],
      },
      {
        id: "c_lumen",
        name: "Lumen Facade Studio",
        trade: "Building envelope",
        city: "Minneapolis",
        people: 48,
        founded: 2016,
        rating: 4.7,
        completed: 29,
        status: "active",
        createdAt: ago(24 * 160),
        about:
          "Lumen designs and installs roofing and facade packages, with a focus on weather-tight milestones and existing buildings.",
        specialties: ["Roofing", "Facade", "Weather barrier", "Replacement"],
        certifications: ["Manufacturer certified", "OSHA 30"],
      },
      {
        id: "c_oak",
        name: "Oak & Crane",
        trade: "General contractor",
        city: "Detroit",
        people: 210,
        founded: 1989,
        rating: 4.6,
        completed: 110,
        status: "active",
        createdAt: ago(24 * 600),
        about:
          "Oak & Crane delivers full commercial projects across the Great Lakes and posts trade packages when a specialist should lead.",
        specialties: ["Industrial", "Education", "Core & shell", "Full project"],
        certifications: ["Licensed general contractor", "OSHA 30", "EMR 0.82"],
      },
      {
        id: "c_bright",
        name: "Brightspan Glass",
        trade: "Glazing",
        city: "Chicago",
        people: 36,
        founded: 2018,
        rating: 4.4,
        completed: 17,
        status: "pending",
        createdAt: ago(6),
        about:
          "Brightspan installs curtain wall and storefront glass. The company has asked to join the marketplace and is waiting for admin approval.",
        specialties: ["Curtain wall", "Storefront", "Replacement glass"],
        certifications: ["OSHA 10"],
      },
      {
        id: "c_oldmill",
        name: "Old Mill Demolition",
        trade: "Demolition",
        city: "Gary",
        people: 28,
        founded: 2001,
        rating: 4.1,
        completed: 33,
        status: "suspended",
        createdAt: ago(24 * 90),
        about:
          "Old Mill handles selective and structural demolition. The profile is suspended and cannot post projects or send proposals until it is reinstated.",
        specialties: ["Selective demolition", "Structural demolition"],
        certifications: ["OSHA 30"],
      },
    ];

    const projects = [
      {
        id: "p_wharf",
        ownerId: "c_meridian",
        title: "Harbor Wharf Office Fit-Out",
        category: "Interior fit-out",
        city: "Chicago",
        budgetMin: 1400000,
        budgetMax: 1900000,
        weeks: 14,
        targetStart: "Apr 2026",
        status: "open",
        createdAt: ago(24 * 20),
        publishedAt: ago(24 * 18),
        awardedProposalId: null,
        awardedAt: null,
        summary:
          "A two-floor commercial interior inside a renovated wharf warehouse, about 42,000 sq ft. The work covers selective demolition, partitions, finishes, and coordination with the base building. Meridian is hiring a company to run this interior project on a fast schedule.",
        scope: [
          "Selective demolition and protection of the existing structure",
          "Partitions, ceilings, and finishes on both floors",
          "Coordination with base-building mechanical and electrical",
          "Public areas ready before the back of house",
        ],
      },
      {
        id: "p_clinic",
        ownerId: "c_meridian",
        title: "West Loop Clinic Core & Shell",
        category: "Core & shell",
        city: "Chicago",
        budgetMin: 6200000,
        budgetMax: 7400000,
        weeks: 40,
        targetStart: "May 2026",
        status: "open",
        createdAt: ago(24 * 12),
        publishedAt: ago(24 * 12),
        awardedProposalId: null,
        awardedAt: null,
        summary:
          "Core and shell for a four-story clinic on a tight West Loop lot. The package includes structure, envelope coordination, and site logistics through weather-tight. Interior fit-out will be a later contract.",
        scope: [
          "Foundations, frame, and decks",
          "Envelope coordination to weather-tight",
          "Site logistics on a constrained street",
          "Stairs and shafts ready for a later fit-out",
        ],
      },
      {
        id: "p_pavilion",
        ownerId: "c_meridian",
        title: "Grant Park Pavilion",
        category: "Full project",
        city: "Chicago",
        budgetMin: 2800000,
        budgetMax: 3400000,
        weeks: 32,
        targetStart: "Jun 2026",
        status: "draft",
        createdAt: ago(24),
        publishedAt: null,
        awardedProposalId: null,
        awardedAt: null,
        summary:
          "A single-story public pavilion and support spaces beside Grant Park. Still a draft while Meridian confirms the site access plan. Not visible on the marketplace until it is published.",
        scope: [
          "Foundations and timber-and-steel frame",
          "Envelope, roof, and public restrooms",
          "Adjacent paving and lighting",
        ],
      },
      {
        id: "p_annex",
        ownerId: "c_meridian",
        title: "Civic Annex Structural Package",
        category: "Structural",
        city: "Chicago",
        budgetMin: 2100000,
        budgetMax: 2600000,
        weeks: 18,
        targetStart: "Jan 2026",
        status: "awarded",
        createdAt: ago(24 * 40),
        publishedAt: ago(24 * 40),
        awardedProposalId: "b_annex_n",
        awardedAt: ago(24 * 6),
        summary:
          "Structural steel and decks for a two-story civic annex tied into an existing building. The project has been awarded. Other proposals stay on the record for comparison.",
        scope: [
          "Steel frame, stairs, and deck",
          "Connections to the existing structure",
          "Erection plan for an occupied campus",
        ],
      },
      {
        id: "p_river",
        ownerId: "c_oak",
        title: "Rivergate Logistics Hall",
        category: "Full project",
        city: "Detroit",
        budgetMin: 18400000,
        budgetMax: 22000000,
        weeks: 60,
        targetStart: "Jul 2026",
        status: "open",
        createdAt: ago(24 * 8),
        publishedAt: ago(24 * 8),
        awardedProposalId: null,
        awardedAt: null,
        summary:
          "A new logistics hall with site work, structure, and envelope. Oak & Crane wants one company to lead delivery and coordinate the major trades through handover.",
        scope: [
          "Site preparation and utilities",
          "Foundations, structure, and roof",
          "Envelope and dock package",
          "Coordination through handover",
        ],
      },
      {
        id: "p_roof",
        ownerId: "c_oak",
        title: "Annex Roof & Envelope",
        category: "Envelope",
        city: "Detroit",
        budgetMin: 900000,
        budgetMax: 1300000,
        weeks: 12,
        targetStart: "Apr 2026",
        status: "open",
        createdAt: ago(24 * 5),
        publishedAt: ago(24 * 5),
        awardedProposalId: null,
        awardedAt: null,
        summary:
          "Replacement roof and facade repairs on an occupied annex. The building must stay dry at the end of each shift, and the loading dock stays in use.",
        scope: [
          "Tear-off and new roof assembly",
          "Facade joint repairs",
          "Temporary protection while occupied",
        ],
      },
      {
        id: "p_prom",
        ownerId: "c_harbor",
        title: "Lakefront Promenade",
        category: "Civil & site",
        city: "Chicago",
        budgetMin: 4500000,
        budgetMax: 5300000,
        weeks: 28,
        targetStart: "May 2026",
        status: "open",
        createdAt: ago(24 * 15),
        publishedAt: ago(24 * 14),
        awardedProposalId: null,
        awardedAt: null,
        summary:
          "A waterfront promenade with paving, lighting bases, utilities, and shoreline protection. Harbor & Pine is hiring a partner who can run the full civil project.",
        scope: [
          "Shoreline protection and grading",
          "Utilities and drainage",
          "Paving, furnishings, and lighting bases",
        ],
      },
      {
        id: "p_kitchen",
        ownerId: "c_oak",
        title: "Lincoln School Kitchen MEP",
        category: "MEP",
        city: "Milwaukee",
        budgetMin: 640000,
        budgetMax: 820000,
        weeks: 10,
        targetStart: "Mar 2026",
        status: "open",
        createdAt: ago(24 * 3),
        publishedAt: ago(24 * 3),
        awardedProposalId: null,
        awardedAt: null,
        summary:
          "Mechanical, electrical, and plumbing replacement for a school kitchen that must reopen before the fall term. Work happens in a live building over a short summer window.",
        scope: [
          "Kitchen mechanical and exhaust",
          "Electrical service and lighting",
          "Plumbing and grease waste",
          "Commissioning before term starts",
        ],
      },
      {
        id: "p_deck",
        ownerId: "c_sable",
        title: "Yardley Parking Deck Repairs",
        category: "Concrete",
        city: "Indianapolis",
        budgetMin: 380000,
        budgetMax: 520000,
        weeks: 8,
        targetStart: "Apr 2026",
        status: "open",
        createdAt: ago(24 * 2),
        publishedAt: ago(24 * 2),
        awardedProposalId: null,
        awardedAt: null,
        summary:
          "Joint replacement, deck patching, and coating on a three-level parking structure. One level must stay open for the adjacent clinic. No proposals have come in yet.",
        scope: [
          "Joint removal and replacement",
          "Partial-depth deck patches",
          "Traffic coating and restriping",
        ],
      },
    ];

    const proposals = [
      {
        id: "b_wharf_v",
        projectId: "p_wharf",
        companyId: "c_vantage",
        amount: 1520000,
        weeks: 14,
        status: "submitted",
        createdAt: ago(2),
        updatedAt: ago(2),
        summary:
          "Phase the floor plate so the public areas hand over first, with a Chicago finishing crew and a dedicated site lead.",
        approach:
          "We split the warehouse into two phases and protect the active path with a temporary partition. Finishes start as soon as demolition of the first bay is signed off, and base-building coordination sits in the same weekly meeting as the interior.",
      },
      {
        id: "b_wharf_a",
        projectId: "p_wharf",
        companyId: "c_apex",
        amount: 1610000,
        weeks: 11,
        status: "submitted",
        createdAt: ago(26),
        updatedAt: ago(26),
        summary:
          "Interior delivery plus mechanical and electrical coordination under one proposal, which removes a separate handoff.",
        approach:
          "Apex would lead the fit-out and carry the MEP coordination with the same superintendent. The shorter duration assumes night work on the public stair and a pre-purchased ceiling package.",
      },
      {
        id: "b_wharf_o",
        projectId: "p_wharf",
        companyId: "c_oak",
        amount: 1740000,
        weeks: 15,
        status: "submitted",
        createdAt: ago(24 * 4),
        updatedAt: ago(24 * 4),
        summary:
          "Full interior delivery with our own site leads and a Chicago finishing partner already on the team.",
        approach:
          "Oak & Crane would hold the schedule and subcontract finishes to a local crew we have used on two warehouse conversions. The extra week is contingency for hidden slab conditions.",
      },
      {
        id: "b_clinic_s",
        projectId: "p_clinic",
        companyId: "c_sable",
        amount: 6450000,
        weeks: 40,
        status: "submitted",
        createdAt: ago(5),
        updatedAt: ago(5),
        summary:
          "Concrete frame and decks with an in-house pumping plan for the tight West Loop site.",
        approach:
          "Sable would self-perform the structure and run pumps from the alley in short windows agreed with the city. Envelope coordination is included through the weather-tight milestone, with a steel sub already named.",
      },
      {
        id: "b_clinic_n",
        projectId: "p_clinic",
        companyId: "c_northline",
        amount: 6820000,
        weeks: 36,
        status: "submitted",
        createdAt: ago(24 * 2),
        updatedAt: ago(24 * 2),
        summary:
          "Steel frame, stairs, and deck, sequenced so the envelope can start before the last bay is topped out.",
        approach:
          "Northline sequences erection from the street side and releases the first two bays early. The faster duration depends on shop drawings starting within ten days of award.",
      },
      {
        id: "b_clinic_o",
        projectId: "p_clinic",
        companyId: "c_oak",
        amount: 7100000,
        weeks: 44,
        status: "submitted",
        createdAt: ago(24 * 6),
        updatedAt: ago(24 * 6),
        summary:
          "Core and shell as a single package, including structure, envelope coordination, and site logistics.",
        approach:
          "Oak & Crane holds the whole core and shell with named structure and facade partners. The longer duration includes a weather month and a full logistics lead for the alley closures.",
      },
      {
        id: "b_annex_n",
        projectId: "p_annex",
        companyId: "c_northline",
        amount: 2380000,
        weeks: 18,
        status: "accepted",
        createdAt: ago(24 * 28),
        updatedAt: ago(24 * 6),
        summary:
          "Steel, stairs, and deck for the annex, with weekend picks so the campus can stay open.",
        approach:
          "Erection happens in weekend windows with a crane on the service court. Connections to the existing frame are scanned before shop drawings are released.",
      },
      {
        id: "b_annex_s",
        projectId: "p_annex",
        companyId: "c_sable",
        amount: 2510000,
        weeks: 20,
        status: "declined",
        createdAt: ago(24 * 27),
        updatedAt: ago(24 * 6),
        summary:
          "A concrete alternative for the annex frame, declined when the steel package was awarded.",
        approach:
          "Sable proposed a concrete frame with shorter picks and a longer cure. The campus constraint made the steel sequence a better fit, and this proposal was declined when the award was made.",
      },
      {
        id: "b_river_s",
        projectId: "p_river",
        companyId: "c_sable",
        amount: 18900000,
        weeks: 60,
        status: "submitted",
        createdAt: ago(24 * 3),
        updatedAt: ago(24 * 3),
        summary:
          "Structure-led delivery of the hall, with site and envelope partners named in the proposal.",
        approach:
          "Sable leads the concrete superstructure and brings a site firm and a roof firm under one schedule. The number sits at the low end of the range and assumes a clear pad on day one.",
      },
      {
        id: "b_river_n",
        projectId: "p_river",
        companyId: "c_northline",
        amount: 19800000,
        weeks: 56,
        status: "submitted",
        createdAt: ago(24 * 2),
        updatedAt: ago(24 * 2),
        summary:
          "Steel-led hall with a faster frame so the envelope can start before the docks are complete.",
        approach:
          "Northline erects from the dock end and releases the roof zones in sequence. A civil partner is included for the yard, and the shorter duration is the main difference from the other proposals.",
      },
      {
        id: "b_river_h",
        projectId: "p_river",
        companyId: "c_harbor",
        amount: 20400000,
        weeks: 64,
        status: "submitted",
        createdAt: ago(24 * 4),
        updatedAt: ago(24 * 4),
        summary:
          "Site-led delivery that carries utilities, the yard, and coordination of the building partners.",
        approach:
          "Harbor & Pine would control the pad, utilities, and yard, and subcontract the building shell. The extra month is for soil improvement that the other proposals list as an allowance.",
      },
      {
        id: "b_roof_l",
        projectId: "p_roof",
        companyId: "c_lumen",
        amount: 1140000,
        weeks: 11,
        status: "submitted",
        createdAt: ago(20),
        updatedAt: ago(20),
        summary:
          "Roof replacement and facade joints with the dock kept open and the building dry each night.",
        approach:
          "Lumen phases the roof in three zones and ties in temporary drainage at the end of every shift. Facade joints are repaired from a swing stage so the dock drive stays clear.",
      },
      {
        id: "b_prom_s",
        projectId: "p_prom",
        companyId: "c_sable",
        amount: 4860000,
        weeks: 26,
        status: "submitted",
        createdAt: ago(24 * 5),
        updatedAt: ago(24 * 5),
        summary:
          "Paving, structures, and flatwork for the promenade, with marine access coordinated around the shoreline work.",
        approach:
          "Sable self-performs the hardscape and brings a marine sub for the shoreline. The duration assumes the sheet pile is released before paving starts.",
      },
      {
        id: "b_prom_o",
        projectId: "p_prom",
        companyId: "c_oak",
        amount: 5120000,
        weeks: 30,
        status: "submitted",
        createdAt: ago(24 * 7),
        updatedAt: ago(24 * 7),
        summary:
          "Full civil delivery with a longer float for permits and a named utilities crew.",
        approach:
          "Oak & Crane holds the promenade as a complete project and includes permit float the others treat as owner time. Utilities are self-performed by a crew already working in the city.",
      },
      {
        id: "b_kitchen_a",
        projectId: "p_kitchen",
        companyId: "c_apex",
        amount: 710000,
        weeks: 10,
        status: "submitted",
        createdAt: ago(30),
        updatedAt: ago(30),
        summary:
          "Kitchen mechanical, electrical, and plumbing sized to finish before the fall term.",
        approach:
          "Apex prefabricates the grease duct and electrical racks so the on-site window stays inside ten weeks. Commissioning is in the last four days, with training for the kitchen staff included.",
      },
    ];

    const notifications = [
      {
        id: "n1",
        for: "c_meridian",
        title: "New proposal",
        body: "Vantage Interiors sent a proposal for Harbor Wharf Office Fit-Out.",
        path: "project/p_wharf",
        at: ago(2),
        read: false,
      },
      {
        id: "n2",
        for: "c_meridian",
        title: "New proposal",
        body: "Sable Concrete Co. sent a proposal for West Loop Clinic Core & Shell.",
        path: "project/p_clinic",
        at: ago(5),
        read: false,
      },
      {
        id: "n3",
        for: "c_meridian",
        title: "Project awarded",
        body: "Civic Annex Structural Package was awarded to Northline Structures.",
        path: "project/p_annex",
        at: ago(24 * 6),
        read: true,
      },
      {
        id: "n4",
        for: "c_meridian",
        title: "New proposal",
        body: "Apex MEP Partners sent a proposal for Harbor Wharf Office Fit-Out.",
        path: "project/p_wharf",
        at: ago(26),
        read: true,
      },
      {
        id: "n5",
        for: "admin",
        title: "Approval waiting",
        body: "Brightspan Glass is waiting to join the marketplace.",
        path: "companies",
        at: ago(6),
        read: false,
      },
      {
        id: "n6",
        for: "admin",
        title: "New project",
        body: "Oak & Crane published Lincoln School Kitchen MEP.",
        path: "project/p_kitchen",
        at: ago(24 * 3),
        read: true,
      },
    ];

    return {
      version: 1,
      seq: 100,
      companies,
      projects,
      proposals,
      notifications,
    };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (!raw) {
        const seed = createSeed();
        localStorage.setItem(DATA_KEY, JSON.stringify(seed));
        return seed;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.companies)) {
        const seed = createSeed();
        localStorage.setItem(DATA_KEY, JSON.stringify(seed));
        return seed;
      }
      return parsed;
    } catch (err) {
      return createSeed();
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch (err) {
      /* The session still works in memory if storage is blocked. */
    }
  }

  function loadSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch (err) {
      return null;
    }
  }

  function saveSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  window.AshlarStore = {
    createSeed,
    loadData,
    saveData,
    loadSession,
    saveSession,
    clearSession,
  };
})();
