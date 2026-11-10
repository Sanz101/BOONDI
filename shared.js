/* ============================================================
   BOONDI — shared state, API client, helpers
   ============================================================ */
(function () {
  "use strict";

  var PACKET_G   = 150;
  var SHELF_DAYS = 30;
  var RATE       = 250;
  var CUR        = "Rs.";

  /* 🔑 CONFIG — paste your deployment URL and secret here */
  var API_URL = "https://script.google.com/macros/s/AKfycbyMphLZoy0P43BihVgzu-pmZ9QrYsX6roQosX_3GJW14KfcfdeS1_odaNxhJtMzJKz5/exec";
  var API_KEY = "sk_sweetops_8f3a1c9e2b7d4f6a";

  var CACHE = null;
  var currentUserId = null;

  /* ---------- helpers ---------- */
  function dAgo(n) { var d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - n); return d; }
  function iso(d)  { return d.toISOString(); }
  function fmtDate(s) { return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); }
  function fmtDT(s)   { return new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  function money(n)   { return CUR + " " + Number(n).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(n, d)  { d = d || 0; return Number(n).toLocaleString("en-LK", { minimumFractionDigits: d, maximumFractionDigits: d }); }

  var ICON = {
    home: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
    chart: '<path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>',
    history: '<path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 13 3zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>',
    logout: '<path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z"/>',
    check: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
    warn: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
    truck: '<path d="M20 8h-3V4H3a2 2 0 0 0-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5l-3-4zM7.5 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM17 12V9.5h2.5l1.96 2.5H17z"/>',
    box: '<path d="M20 2H4a2 2 0 0 0-2 2v3.01A2 2 0 0 0 3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9c.67-.01 1-.45 1-1V4a2 2 0 0 0-2-2zm-9 14h-2v-4H7l3.5-4.5L14 12h-2v4zm7-9H4V4h14v3z"/>',
    cash: '<path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>',
    person: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
    add: '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>',
    chev: '<path d="M9.29 6.71a1 1 0 0 0 0 1.41L13.17 12l-3.88 3.88a1 1 0 1 0 1.42 1.41l4.58-4.58a1 1 0 0 0 0-1.42L10.7 6.71a1 1 0 0 0-1.41 0z"/>',
    scale: '<path d="M12 3a2 2 0 0 1 1 3.73V9h5.5l2.5 6a4 4 0 0 1-7.5 2h-.5v2h4v2H7v-2h4v-2h-.5a4 4 0 0 1-7.5-2l2.5-6H11V6.73A2 2 0 0 1 12 3zm-4.5 8L5.8 14h5.4L9.5 11zm9 0-1.7 3h5.4l-1.7-3z"/>'
  };
  function icon(name, size) {
    size = size || 20;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="currentColor" aria-hidden="true">' + (ICON[name] || "") + "</svg>";
  }

  /* brand logo SVG — five circles = boondi */
  function brandLogo(size) {
    size = size || 38;
    return '<svg viewBox="0 0 24 24" width="' + Math.round(size*0.55) + '" height="' + Math.round(size*0.55) + '" fill="currentColor" aria-hidden="true">' +
      '<circle cx="8" cy="8" r="2.6"/><circle cx="16" cy="8" r="2.6"/>' +
      '<circle cx="12" cy="12" r="2.6"/><circle cx="8" cy="16" r="2.6"/>' +
      '<circle cx="16" cy="16" r="2.6"/>' +
    '</svg>';
  }

  /* ---------- users ---------- */
  var USERS = [
    { id: "u1", name: "Pasan",    role: "supplier",    password: "pasan123" },
    { id: "u2", name: "Kalsara",  role: "supplier",    password: "kalsara123" },
    { id: "u3", name: "Daham",    role: "stockkeeper", password: "daham123" },
    { id: "u4", name: "Chaminda", role: "stockkeeper", password: "chaminda123" },
    { id: "u5", name: "Bura",     role: "seller",      password: "bura123" }
  ];

  /* ---------- API ---------- */
  function apiGet(action) {
    return fetch(API_URL + "?key=" + encodeURIComponent(API_KEY) + "&action=" + action)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) throw new Error(j.error || "API error");
        return j;
      });
  }

  /* POST — key is passed BOTH in the URL and the body.
     The URL copy is what Code.gs's checkKey() reads via e.parameter.key,
     so this must stay even if the body already has the key. */
  function apiPost(action, payload) {
    var url = API_URL + "?key=" + encodeURIComponent(API_KEY);
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action, payload: payload, key: API_KEY })
    }).then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) throw new Error(j.error || "API error");
        return j;
      });
  }

  function loadAll() {
    return apiGet("getAll").then(function (j) {
      CACHE = {
        users: j.users || [],
        purchases: j.purchases || [],
        packaging: j.packaging || [],
        transfers: j.transfers || [],
        sales: j.sales || [],
        activity: j.activity || []
      };
      return CACHE;
    });
  }

  function getState() {
    return CACHE || { users: [], purchases: [], packaging: [], transfers: [], sales: [], activity: [] };
  }

  /* ---------- session ---------- */
  var REMEMBER_KEY = "boondi_remember";
  var SESSION_KEY  = "boondi_uid";

  function setUser(u) {
    currentUserId = u.id;
    try { sessionStorage.setItem(SESSION_KEY, u.id); } catch (e) {}
  }
  function getUser() {
    var id = currentUserId;
    if (!id) { try { id = sessionStorage.getItem(SESSION_KEY); } catch (e) {} }
    if (!id) return null;
    currentUserId = id;
    return USERS.find(function (u) { return u.id === id; }) || null;
  }
  function requireUser() {
    var u = getUser();
    if (!u) {
      document.body.classList.add("page-leaving");
      setTimeout(function () { window.location.replace("index.html"); }, 150);
      return null;
    }
    return u;
  }
  function saveRemember(user, pw) {
    try { localStorage.setItem(REMEMBER_KEY, JSON.stringify({ id: user.id, pw: pw })); } catch (e) {}
  }
  function clearRemember() {
    try { localStorage.removeItem(REMEMBER_KEY); } catch (e) {}
  }
  function getRemember() {
    try { return JSON.parse(localStorage.getItem(REMEMBER_KEY) || "null"); } catch (e) { return null; }
  }
  function signOut() {
    currentUserId = null;
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    clearRemember();
    document.body.classList.add("page-leaving");
    setTimeout(function () { window.location.href = "index.html"; }, 180);
  }

  /* ---------- labels ---------- */
  function roleLabel(r) { return r === "supplier" ? "Supplier" : r === "stockkeeper" ? "Stock Keeper" : "Seller"; }
  function avClass(r)   { return r === "supplier" ? "sup" : r === "stockkeeper" ? "stk" : "sel"; }

  /* ---------- calculations ---------- */
  function calc() {
    var s = getState();
    function conf(a) { return a.filter(function (x) { return x.status === "Confirmed"; }); }

    var cP = conf(s.purchases);
    var kgBought = cP.reduce(function (a, p) { return a + Number(p.kg); }, 0);
    var costBought = cP.reduce(function (a, p) { return a + Number(p.kg) * Number(p.costPerKg); }, 0);
    var avgCostKg = kgBought ? costBought / kgBought : 0;

    var cK = conf(s.packaging);
    var packetsMade = cK.reduce(function (a, p) { return a + Number(p.packets); }, 0);
    var kgPacked = packetsMade * PACKET_G / 1000;
    var jenningsKg = Math.max(0, kgBought - kgPacked);

    var cT = conf(s.transfers);
    var packetsSent = cT.reduce(function (a, t) { return a + Number(t.packets); }, 0);
    var jenningsPackets = packetsMade - packetsSent;

    var packetsSold = s.sales.reduce(function (a, x) { return a + Number(x.packets); }, 0);
    var nishmiPackets = packetsSent - packetsSold;

    var revenue = s.sales.reduce(function (a, x) { return a + Number(x.revenue); }, 0);
    var cogs    = s.sales.reduce(function (a, x) { return a + Number(x.cogs); }, 0);
    var profit  = revenue - cogs;
    var cpp = packetsMade ? (kgPacked * avgCostKg) / packetsMade : 0;

    /* loss per intake */
    var intakes = conf(s.purchases).sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    var runs = conf(s.packaging).sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    var losses = [];
    for (var i = 0; i < intakes.length; i++) {
      var intake = intakes[i];
      var next = intakes[i + 1];
      var inWindow = runs.filter(function (k) {
        var kt = new Date(k.date).getTime(), st = new Date(intake.date).getTime();
        var en = next ? new Date(next.date).getTime() : Infinity;
        return kt >= st && kt < en;
      });
      var pkts = inWindow.reduce(function (a, k) { return a + Number(k.packets); }, 0);
      var usedKg = pkts * PACKET_G / 1000;
      var lostKg = Math.max(0, Number(intake.kg) - usedKg);
      if (pkts > 0 || next) {
        losses.push({
          intakeId: intake.id, intakeKg: Number(intake.kg),
          packetsUsed: pkts, usedKg: usedKg, lossKg: lostKg,
          lossPct: intake.kg ? (lostKg / intake.kg) * 100 : 0,
          supplier: intake.supplier, date: intake.date
        });
      }
    }
    var totalLossKg = losses.reduce(function (a, l) { return a + l.lossKg; }, 0);

    var days = [];
    for (var d = 6; d >= 0; d--) {
      var day = dAgo(d), key = day.toDateString();
      var qty = s.sales.filter(function (x) { return new Date(x.date).toDateString() === key; })
                       .reduce(function (a, x) { return a + Number(x.packets); }, 0);
      days.push({ date: day, label: day.toLocaleDateString("en-GB", { weekday: "short" }), qty: qty });
    }
    var weekSold = days.reduce(function (a, d) { return a + d.qty; }, 0);
    var avgDaily = weekSold / 7;

    var nishmiDays   = avgDaily > 0 ? nishmiPackets / avgDaily : Infinity;
    var jenningsDays = avgDaily > 0 ? jenningsPackets / avgDaily : Infinity;
    var kgForDay     = (avgDaily * PACKET_G) / 1000;

    return {
      kgBought: kgBought, costBought: costBought, avgCostKg: avgCostKg,
      kgPacked: kgPacked, packetsMade: packetsMade, lossKg: totalLossKg, losses: losses,
      jenningsKg: jenningsKg, packetsSent: packetsSent, jenningsPackets: jenningsPackets,
      packetsSold: packetsSold, nishmiPackets: nishmiPackets,
      revenue: revenue, cogs: cogs, profit: profit, cpp: cpp,
      days: days, weekSold: weekSold, avgDaily: avgDaily,
      nishmiDays: nishmiDays, jenningsDays: jenningsDays, kgForDay: kgForDay,
      pendingPurchases: s.purchases.filter(function (p) { return p.status === "Pending"; }),
      pendingPackaging: s.packaging.filter(function (p) { return p.status === "Pending"; }),
      pendingTransfers: s.transfers.filter(function (t) { return t.status === "Pending"; })
    };
  }

  /* ---------- permissions ---------- */
  function canConfirm(kind, createdBy, me) {
    if (!me || createdBy === me.name) return false;
    if (kind === "purchase")  return me.role === "stockkeeper";
    if (kind === "packaging") return me.role === "stockkeeper";
    if (kind === "transfer")  return me.role === "seller";
    return false;
  }

  function pendingForUser(me) {
    if (!me) return [];
    var s = getState(), out = [];
    if (me.role === "stockkeeper") {
      s.purchases.filter(function (p) { return p.status === "Pending" && p.supplier !== me.name; })
        .forEach(function (p) { out.push({ kind: "purchase", id: p.id }); });
      s.packaging.filter(function (k) { return k.status === "Pending" && k.by !== me.name; })
        .forEach(function (k) { out.push({ kind: "packaging", id: k.id }); });
    }
    if (me.role === "seller") {
      s.transfers.filter(function (t) { return t.status === "Pending" && t.by !== me.name; })
        .forEach(function (t) { out.push({ kind: "transfer", id: t.id }); });
    }
    return out;
  }

  function itemOf(kind, id) {
    var s = getState();
    if (kind === "purchase") {
      var p = s.purchases.find(function (x) { return x.id === id; });
      if (!p) return null;
      return { kind: kind, id: id, icon: "truck", title: "Intake received?",
        sub: "A delivery is waiting for your confirmation.",
        rows: [["Reference", p.id], ["From", p.supplier], ["Weight", num(p.kg, 1) + " kg"], ["Value", money(p.kg * p.costPerKg)], ["Arrived", fmtDT(p.date)]],
        effect: "This will add <b>" + num(p.kg, 1) + " kg</b> to Jennings raw stock.",
        createdBy: p.supplier };
    }
    if (kind === "packaging") {
      var k = s.packaging.find(function (x) { return x.id === id; });
      if (!k) return null;
      var used = Number(k.packets) * PACKET_G / 1000;
      return { kind: kind, id: id, icon: "box", title: "Packaging confirmation",
        sub: "Another stock keeper recorded a packaging run.",
        rows: [["Reference", k.id], ["Packed by", k.by], ["Packets", k.packets], ["Raw used", num(used, 2) + " kg"]],
        effect: "This will add <b>" + k.packets + " packets</b> to Jennings and consume <b>" + num(used, 2) + " kg</b> of raw stock.",
        createdBy: k.by };
    }
    if (kind === "transfer") {
      var t = s.transfers.find(function (x) { return x.id === id; });
      if (!t) return null;
      return { kind: kind, id: id, icon: "truck", title: "Transfer received?",
        sub: "Packets were sent from Jennings to Nishmi.",
        rows: [["Reference", t.id], ["Sent by", t.by], ["Packets", t.packets], ["Sent", fmtDT(t.date)]],
        effect: "This will add <b>" + t.packets + " packets</b> to Nishmi stock.",
        createdBy: t.by };
    }
    return null;
  }

  /* ---------- mutations ---------- */
  function log(who, kind, text) {
    var entry = { at: new Date().toISOString(), who: who, kind: kind, text: text };
    apiPost("logActivity", entry).catch(function (e) { console.warn("activity log failed", e); });
    getState().activity.unshift(entry);
  }

  function nextId(prefix, list) { return prefix + (1000 + list.length + 1); }

  function addPurchase(me, kg, cost) {
    var p = { id: nextId("P-", getState().purchases), date: new Date().toISOString(), supplier: me.name, kg: kg, costPerKg: cost, status: "Pending", confirmedBy: "", confirmedAt: "" };
    return apiPost("addPurchase", p).then(function () {
      getState().purchases.push(p);
      log(me.name, "purchase", "Recorded a delivery of " + num(kg, 1) + " kg — pending");
    });
  }

  function addPackaging(me, packets) {
    var k = { id: nextId("K-", getState().packaging), date: new Date().toISOString(), by: me.name, packets: packets, status: "Pending", confirmedBy: "", confirmedAt: "" };
    return apiPost("addPackaging", k).then(function () {
      getState().packaging.push(k);
      log(me.name, "packaging", "Packed " + packets + " packets — pending");
    });
  }

  function addTransfer(me, packets) {
    var t = { id: nextId("T-", getState().transfers), date: new Date().toISOString(), packets: packets, by: me.name, status: "Pending", confirmedBy: "", confirmedAt: "" };
    return apiPost("addTransfer", t).then(function () {
      getState().transfers.push(t);
      log(me.name, "transfer", "Sent " + packets + " packets to Nishmi — pending");
    });
  }

  function confirmItem(kind, id, me) {
    var when = new Date().toISOString();
    return apiPost("confirmItem", { kind: kind, id: id, by: me.name, at: when }).then(function () {
      var tab = kind === "purchase" ? "purchases" : kind === "packaging" ? "packaging" : "transfers";
      var item = getState()[tab].find(function (x) { return x.id === id; });
      if (item) { item.status = "Confirmed"; item.confirmedBy = me.name; item.confirmedAt = when; }
      var text = kind === "purchase" ? "Confirmed intake " + id
               : kind === "packaging" ? "Confirmed " + (item ? item.packets : "") + " packets"
               : "Received " + (item ? item.packets : "") + " packets at Nishmi";
      log(me.name, kind, text);
    });
  }

  function addSale(me, packets, unitPrice) {
    var c = calc();
    var revenue = packets * unitPrice;
    var cogs = packets * c.cpp;
    var s = { id: nextId("S-", getState().sales), date: new Date().toISOString(), by: me.name, packets: packets, unitPrice: unitPrice, revenue: revenue, cogs: cogs, profit: revenue - cogs };
    return apiPost("addSale", s).then(function () {
      getState().sales.push(s);
      log(me.name, "sale", "Sold " + packets + " packets — " + money(revenue));
    });
  }

  /* ---------- toast ---------- */
  function toast(msg) {
    var el = document.getElementById("snackbar");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 2800);
  }

  /* ---------- navigation ---------- */
  var PAGE = "";
  function setPage(p) { PAGE = p; }
  function isPage(p) { return PAGE === p; }
  function goPage(p) {
    if (isPage(p)) return;
    document.body.classList.add("page-leaving");
    setTimeout(function () { window.location.href = p + ".html"; }, 180);
  }

  function appBar(me, pendingCount) {
    return '<header class="appbar"><div class="appbar-in">' +
      '<div class="logo">' + brandLogo(38) + '</div>' +
      '<div class="brand-txt"><div class="n">BOONDI</div><div class="s">Jennings → Nishmi</div></div>' +
      '<div class="spacer"></div>' +
      '<div class="user-chip"><span class="avatar ' + avClass(me.role) + '">' + me.name[0] + '</span>' +
        '<span><span class="nm">' + me.name + '</span><span class="rl">' + roleLabel(me.role) + '</span></span></div>' +
      '<button class="icon-btn" data-logout title="Sign out">' + icon("logout", 20) + '</button>' +
    '</div></header>' +
    '<nav class="tabs"><div class="tabs-in">' +
      '<button class="tab ' + (isPage("dashboard") ? "on" : "") + '" data-nav="dashboard">' + icon("home", 18) + ' <span>Dashboard</span></button>' +
      '<button class="tab ' + (isPage("reports") ? "on" : "") + '" data-nav="reports">' + icon("chart", 18) + ' <span>Reports</span></button>' +
      '<button class="tab ' + (isPage("activity") ? "on" : "") + '" data-nav="activity">' + icon("history", 18) + ' <span>Activity</span>' +
        (pendingCount ? '<span class="badge">' + pendingCount + '</span>' : "") +
      '</button>' +
    '</div></nav>';
  }

  function loadingView() {
    return '<div class="loading"><div class="spinner"></div><p class="muted small">Loading your data…</p></div>';
  }

  function errorView(errMsg) {
    return '<div class="loading">' +
      '<div style="text-align:center;max-width:320px">' +
      '<h2 style="font-size:18px;margin-bottom:8px">Could not reach the sheet</h2>' +
      '<p class="muted small" style="margin-bottom:18px">' + errMsg + '</p>' +
      '<button class="md-btn filled" onclick="location.reload()">Retry</button>' +
      '</div></div>';
  }

  /* ---------- confirm modal ---------- */
  var modal = { item: null, step: 1, queue: [], onDone: null };

  function showConfirmModal(kind, id, onDone) {
    var me = getUser();
    var it = itemOf(kind, id);
    if (!it) return;
    if (!canConfirm(kind, it.createdBy, me)) return toast("You cannot confirm this entry");
    modal.item = it;
    modal.step = 1;
    modal.queue = [];
    modal.onDone = onDone;
    renderModal();
  }

  function showConfirmQueue(onDone) {
    var me = getUser();
    var q = pendingForUser(me);
    if (!q.length) return toast("Nothing waiting for you");
    modal.queue = q.slice();
    modal.onDone = onDone;
    advanceModal();
  }

  function advanceModal() {
    var next = modal.queue.shift();
    if (!next) {
      closeModal();
      if (modal.onDone) modal.onDone();
      return;
    }
    var it = itemOf(next.kind, next.id);
    if (!it) return advanceModal();
    modal.item = it;
    modal.step = 1;
    renderModal();
  }

  function renderModal() {
    var existing = document.querySelector(".scrim");
    if (existing) existing.remove();
    if (!modal.item) return;

    var it = modal.item;
    var scrim = document.createElement("div");
    scrim.className = "scrim";

    if (modal.step === 1) {
      var rows = it.rows.map(function (r) {
        return '<div style="display:flex;justify-content:space-between;gap:12px">' +
          '<span class="k">' + r[0] + '</span><b>' + r[1] + '</b></div>';
      }).join("");
      scrim.innerHTML = '<div class="dialog" role="dialog" aria-modal="true">' +
        '<div class="dic">' + icon(it.icon, 22) + '</div>' +
        '<h2>' + it.title + '</h2><p>' + it.sub + '</p>' +
        '<div class="detail">' + rows + '</div>' +
        '<div class="actions">' +
          '<button class="md-btn text" data-modal-notyet>Not yet</button>' +
          '<button class="md-btn filled" data-modal-next>Yes, I confirm</button>' +
        '</div></div>';
    } else {
      scrim.innerHTML = '<div class="dialog" role="dialog" aria-modal="true">' +
        '<div class="dic warn">' + icon("warn", 22) + '</div>' +
        '<h2>Double check</h2><p>' + it.effect + '</p>' +
        '<p><b>This cannot be undone.</b> Make sure the numbers match what you physically have.</p>' +
        '<div class="actions">' +
          '<button class="md-btn outlined" data-modal-back>Go back</button>' +
          '<button class="md-btn filled" data-modal-apply>Yes, confirm</button>' +
        '</div></div>';
    }
    document.body.appendChild(scrim);
  }

  function closeModal() {
    modal.item = null;
    modal.step = 1;
    modal.queue = [];
    var s = document.querySelector(".scrim");
    if (s) s.remove();
  }

  /* ---------- one delegated listener for chrome + modal ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target;
    while (el && el !== document) {
      if (el.matches) {
        if (el.matches("[data-logout]")) { signOut(); return; }
        if (el.matches("[data-nav]")) { goPage(el.getAttribute("data-nav")); return; }
        if (el.matches("[data-modal-next]")) { modal.step = 2; renderModal(); return; }
        if (el.matches("[data-modal-back]")) { modal.step = 1; renderModal(); return; }
        if (el.matches("[data-modal-apply]")) {
          var me = getUser();
          confirmItem(modal.item.kind, modal.item.id, me).then(function () {
            toast("Confirmed");
            advanceModal();
          }).catch(function (err) { toast("Failed: " + err.message); });
          return;
        }
        if (el.matches("[data-modal-notyet]")) {
          toast("Kept as pending");
          advanceModal();
          return;
        }
        if (el.classList && el.classList.contains("scrim") && el === e.target) {
          closeModal();
          return;
        }
      }
      el = el.parentNode;
    }
  });

  /* ---------- expose ---------- */
  window.SweetOps = {
    PACKET_G: PACKET_G, SHELF_DAYS: SHELF_DAYS, RATE: RATE, CUR: CUR,
    users: USERS,
    CONFIG: { API_URL: API_URL, API_KEY: API_KEY },
    loadAll: loadAll,
    getState: getState,
    calc: calc,
    canConfirm: canConfirm,
    pendingForUser: pendingForUser,
    itemOf: itemOf,
    addPurchase: addPurchase,
    addPackaging: addPackaging,
    addTransfer: addTransfer,
    confirmItem: confirmItem,
    addSale: addSale,
    log: log,
    toast: toast,
    icon: icon, brandLogo: brandLogo,
    money: money, num: num,
    fmtDate: fmtDate, fmtDT: fmtDT,
    dAgo: dAgo, iso: iso,
    roleLabel: roleLabel, avClass: avClass,
    setUser: setUser, getUser: getUser, requireUser: requireUser,
    signOut: signOut,
    saveRemember: saveRemember, clearRemember: clearRemember, getRemember: getRemember,
    appBar: appBar, loadingView: loadingView, errorView: errorView,
    setPage: setPage, isPage: isPage, goPage: goPage,
    showConfirmModal: showConfirmModal,
    showConfirmQueue: showConfirmQueue,
    closeModal: closeModal
  };
  window.A = window.SweetOps;
})();
