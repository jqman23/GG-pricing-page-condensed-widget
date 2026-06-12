(function () {
  const P = {
    global: 175,
    skillHalf: 50,
    skillFull: 90,
    bundleDiscount: 25,
    earlyRate: 0.10,
    studentDiscount: 75,
    ceu: 50,
    groupHalfSkill: 25
  };

  const $ = id => document.getElementById(id);

  const fields = [
    "mode",
    "lived",
    "student",
    "ceu",
    "event",
    "skillLength",
    "early",
    "groupSize",
    "groupAddons",
    "groupSkillCount",
    "groupCeuCount",
    "groupEarly"
  ];

  fields.forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("change", update);
    el.addEventListener("input", update);
  });

  function money(value) {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function show(id, on) {
    $(id).style.display = on ? "block" : "none";
  }

  function hideResult() {
    $("priceResult").classList.remove("show");
    $("priceResult").textContent = "";
  }

  function showPrice(label, price) {
    $("priceResult").textContent = `${label}: ${money(price)}`;
    $("priceResult").classList.add("show");
    emitHeight();
  }

  function groupRate(size) {
    if (size >= 50) return 90;
    if (size >= 40) return 105;
    if (size >= 30) return 120;
    if (size >= 20) return 135;
    return 150;
  }

  function num(id, fallback) {
    const value = parseInt($(id).value, 10);
    return isNaN(value) ? fallback : value;
  }

  function update() {
    const mode = $("mode").value;

    show("individualFlow", mode === "individual");
    show("groupFlow", mode === "group");

    if (!mode) {
      resetAfterMode();
      hideResult();
      return;
    }

    if (mode === "individual") updateIndividual();
    if (mode === "group") updateGroup();

    emitHeight();
  }

  function resetAfterMode() {
    [
      "stepLived",
      "stepStudent",
      "stepCeu",
      "stepEvent",
      "stepSkillLength",
      "stepEarly",
      "stepGroupSize",
      "stepGroupAddons",
      "stepGroupCounts",
      "stepGroupEarly"
    ].forEach(id => show(id, false));
  }

  function updateIndividual() {
    const lived = $("lived").value;
    const student = $("student").value;
    const ceu = $("ceu").value;
    const event = $("event").value;
    const skillLength = $("skillLength").value;
    const early = $("early").value;

    show("stepLived", true);
    show("stepStudent", !!lived);
    show("stepCeu", !!lived && !!student);
    show("stepEvent", !!lived && !!student && !!ceu);

    const needsSkillLength = event === "skill" || event === "both";
    const needsEarly = event === "global" || event === "both";

    show("stepSkillLength", !!event && needsSkillLength);
    show("stepEarly", !!event && needsEarly && (!needsSkillLength || !!skillLength));

    if (!lived || !student || !ceu || !event) {
      hideResult();
      return;
    }

    if (needsSkillLength && !skillLength) {
      hideResult();
      return;
    }

    if (needsEarly && !early) {
      hideResult();
      return;
    }

    let price = 0;

    if (event === "global") {
      price = P.global;
    }

    if (event === "skill") {
      price = skillLength === "half" ? P.skillHalf : P.skillFull;
    }

    if (event === "both") {
      price = P.global + (skillLength === "half" ? P.skillHalf : P.skillFull);
      price -= P.bundleDiscount;
    }

    if (needsEarly && early === "yes") {
      const earlyBase = event === "both"
        ? P.global + (skillLength === "half" ? P.skillHalf : P.skillFull)
        : P.global;

      price -= earlyBase * P.earlyRate;
    }

    if (student === "yes" && event !== "skill") {
      price -= P.studentDiscount;
    }

    if (lived === "yes") {
      price = 0;
    }

    if (ceu === "yes" && event !== "skill") {
      price += P.ceu;
    }

    showPrice("Estimated cost", price);
  }

  function updateGroup() {
    const groupSizeRaw = $("groupSize").value;
    const groupAddons = $("groupAddons").value;
    const groupEarly = $("groupEarly").value;

    show("stepGroupSize", true);

    const groupSize = num("groupSize", 0);
    const validGroupSize = groupSize >= 10;

    show("stepGroupAddons", validGroupSize);
    show("stepGroupCounts", validGroupSize && groupAddons === "yes");
    show("stepGroupEarly", validGroupSize && !!groupAddons);

    if (!groupSizeRaw || !validGroupSize || !groupAddons || !groupEarly) {
      hideResult();
      return;
    }

    const rate = groupRate(groupSize);
    let groupTotal = groupSize * rate;

    if (groupEarly === "yes") {
      groupTotal -= groupTotal * P.earlyRate;
    }

    if (groupAddons === "yes") {
      const skillCount = Math.min(num("groupSkillCount", 0), groupSize);
      const ceuCount = Math.min(num("groupCeuCount", 0), groupSize);

      groupTotal += skillCount * P.groupHalfSkill;
      groupTotal += ceuCount * P.ceu;
    }

    const perPerson = groupTotal / groupSize;
    showPrice("Estimated average cost per person", perPerson);
  }

  function emitHeight() {
    const root = $("ggPriceWidget");
    if (!root) return;

    window.parent.postMessage({
      ggPriceWidgetHeight: root.scrollHeight + 24
    }, "*");
  }

  update();
})();
