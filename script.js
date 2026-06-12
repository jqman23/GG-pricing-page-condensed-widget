(function () {
  const PRICING = {
    global: 175,
    skillHalf: 50,
    skillFull: 90,
    bundleDiscount: 25,
    earlyRate: 0.10,
    studentDiscount: 75,
    ceu: 50,
    groupHalfSkill: 25,
    groupRates: [
      { min: 50, rate: 90 },
      { min: 40, rate: 105 },
      { min: 30, rate: 120 },
      { min: 20, rate: 135 },
      { min: 10, rate: 150 }
    ]
  };

  const ids = [
    "ggSpMode",
    "ggSpLived",
    "ggSpStudent",
    "ggSpCeu",
    "ggSpEvent",
    "ggSpSkillLength",
    "ggSpEarly",
    "ggSpGroupSize",
    "ggSpGroupAddons",
    "ggSpGroupSkills",
    "ggSpGroupCeus",
    "ggSpGroupEarly"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", updatePrice);
    el.addEventListener("input", updatePrice);
  });

  function money(value) {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function show(el, shouldShow) {
    el.style.display = shouldShow ? "" : "none";
  }

  function numberValue(id, min, max) {
    const el = document.getElementById(id);
    let value = parseInt(el.value, 10);

    if (isNaN(value)) value = min;
    if (value < min) value = min;
    if (typeof max === "number" && value > max) value = max;

    el.value = value;
    return value;
  }

  function groupRateFor(size) {
    for (const tier of PRICING.groupRates) {
      if (size >= tier.min) return tier.rate;
    }

    return 150;
  }

  function tierNudgeFor(size) {
    const bands = [
      { min: 18, max: 19, next: 20 },
      { min: 27, max: 29, next: 30 },
      { min: 35, max: 39, next: 40 },
      { min: 43, max: 49, next: 50 }
    ];

    return bands.find(b => size >= b.min && size <= b.max);
  }

  function render(total, summary, lines, nudgeText) {
    document.getElementById("ggSpTotal").textContent = money(Math.max(total, 0));
    document.getElementById("ggSpSummary").textContent = summary;
    document.getElementById("ggSpBreakdown").innerHTML = lines.map(line => `<div>${line}</div>`).join("");

    const nudge = document.getElementById("ggSpNudge");
    nudge.textContent = nudgeText || "";
    nudge.style.display = nudgeText ? "block" : "none";

    emitHeight();
  }

  function updatePrice() {
    const mode = document.getElementById("ggSpMode").value;

    show(document.getElementById("ggSpIndividualFlow"), mode === "individual");
    show(document.getElementById("ggSpGroupFlow"), mode === "group");

    if (mode === "group") {
      updateGroupPrice();
    } else {
      updateIndividualPrice();
    }
  }

  function updateIndividualPrice() {
    document.getElementById("ggSpTotalLabel").textContent = "Estimated Individual Registration Cost";

    const eventType = document.getElementById("ggSpEvent").value;
    const hasGlobal = eventType === "global" || eventType === "both";
    const hasSkill = eventType === "skill" || eventType === "both";

    show(document.getElementById("ggSpSkillLine"), hasSkill);
    show(document.getElementById("ggSpEarlyLine"), hasGlobal);

    const studentSelect = document.getElementById("ggSpStudent");
    if (!hasGlobal) {
      studentSelect.value = "no";
      studentSelect.disabled = true;
    } else {
      studentSelect.disabled = false;
    }

    const lived = document.getElementById("ggSpLived").value === "yes";
    const student = document.getElementById("ggSpStudent").value === "yes";
    const ceu = document.getElementById("ggSpCeu").value === "yes";
    const early = hasGlobal && document.getElementById("ggSpEarly").value === "before";
    const skillLength = document.getElementById("ggSpSkillLength").value;

    show(document.getElementById("ggSpLivedNote"), lived);

    let total = 0;
    let lines = [];
    let summary = "";

    if (eventType === "global") {
      total = PRICING.global;
      summary = "Global Gathering only";
      lines.push(`Global Gathering: ${money(PRICING.global)}`);

      if (early) {
        const discount = PRICING.global * PRICING.earlyRate;
        total -= discount;
        lines.push(`Early Bird Discount: -${money(discount)}`);
      }

      if (student) {
        total -= PRICING.studentDiscount;
        lines.push(`Student Discount: -${money(PRICING.studentDiscount)}`);
      }

      if (lived) {
        total = 0;
        lines = ["Lived Experience Scholarship applied"];
      }

      if (ceu) {
        total += PRICING.ceu;
        lines.push(`CEU fee: +${money(PRICING.ceu)}`);
      }
    }

    if (eventType === "skill") {
      const skillPrice = skillLength === "half" ? PRICING.skillHalf : PRICING.skillFull;

      total = skillPrice;
      summary = skillLength === "half"
        ? "Half-day Skill Building Institutes only"
        : "Full-day Skill Building Institutes only";

      lines.push(`${skillLength === "half" ? "Half-day" : "Full-day"} Skill Building Institutes: ${money(skillPrice)}`);
      lines.push("Early Bird and Student discounts do not apply to Skill Building Institutes only.");

      if (lived) {
        total = 0;
        lines = ["Lived Experience Scholarship applied"];
      }

      if (ceu) {
        lines.push("CEUs included at no additional cost for Skill Building Institutes.");
      }
    }

    if (eventType === "both") {
      const skillPrice = skillLength === "half" ? PRICING.skillHalf : PRICING.skillFull;
      const subtotal = PRICING.global + skillPrice;

      total = subtotal;
      summary = skillLength === "half"
        ? "Global Gathering + half-day Skill Building Institutes"
        : "Global Gathering + full-day Skill Building Institutes";

      lines.push(`Global Gathering: ${money(PRICING.global)}`);
      lines.push(`${skillLength === "half" ? "Half-day" : "Full-day"} Skill Building Institutes: ${money(skillPrice)}`);

      if (early) {
        const discount = subtotal * PRICING.earlyRate;
        total -= discount;
        lines.push(`Early Bird Discount: -${money(discount)}`);
      }

      total -= PRICING.bundleDiscount;
      lines.push(`Bundle Discount: -${money(PRICING.bundleDiscount)}`);

      if (student) {
        total -= PRICING.studentDiscount;
        lines.push(`Student Discount: -${money(PRICING.studentDiscount)}`);
      }

      if (lived) {
        total = 0;
        lines = ["Lived Experience Scholarship applied"];
      }

      if (ceu) {
        total += PRICING.ceu;
        lines.push(`CEU fee: +${money(PRICING.ceu)}`);
      }
    }

    render(total, summary, lines, "");
  }

  function updateGroupPrice() {
    document.getElementById("ggSpTotalLabel").textContent = "Estimated Group Registration Cost";

    const groupSize = numberValue("ggSpGroupSize", 10, 999);
    const groupRate = groupRateFor(groupSize);
    const globalSubtotal = groupSize * groupRate;
    const early = document.getElementById("ggSpGroupEarly").value === "before";
    const addons = document.getElementById("ggSpGroupAddons").value === "yes";

    show(document.getElementById("ggSpGroupAddonLines"), addons);

    let total = globalSubtotal;
    let lines = [
      `${groupSize} Global Gathering registrations x ${money(groupRate)}: ${money(globalSubtotal)}`
    ];

    if (early) {
      const discount = globalSubtotal * PRICING.earlyRate;
      total -= discount;
      lines.push(`Early Bird Discount: -${money(discount)}`);
    }

    if (addons) {
      const groupSkills = numberValue("ggSpGroupSkills", 0, groupSize);
      const groupCeus = numberValue("ggSpGroupCeus", 0, groupSize);

      if (groupSkills > 0) {
        const skillSubtotal = groupSkills * PRICING.groupHalfSkill;
        total += skillSubtotal;
        lines.push(`Half-day Skill Building Institutes: ${groupSkills} x ${money(PRICING.groupHalfSkill)} = ${money(skillSubtotal)}`);
      }

      if (groupCeus > 0) {
        const ceuSubtotal = groupCeus * PRICING.ceu;
        total += ceuSubtotal;
        lines.push(`CEUs: ${groupCeus} x ${money(PRICING.ceu)} = ${money(ceuSubtotal)}`);
      }
    } else {
      document.getElementById("ggSpGroupSkills").value = 0;
      document.getElementById("ggSpGroupCeus").value = 0;
    }

    const band = tierNudgeFor(groupSize);
    const nudgeText = band
      ? `Adding ${band.next - groupSize} more registrant${band.next - groupSize === 1 ? "" : "s"} lowers your per-person Global Gathering rate.`
      : "";

    render(
      total,
      `Group registration: ${groupSize} people at ${money(groupRate)} per Global Gathering registration`,
      lines,
      nudgeText
    );
  }

  function emitHeight() {
    const root = document.getElementById("ggSimplePricingWidget");
    if (!root) return;

    window.parent.postMessage({
      ggSimplePricingWidgetHeight: root.scrollHeight + 32
    }, "*");
  }

  window.addEventListener("resize", emitHeight);
  updatePrice();
})();
