/* ============================================================
   BOONDI — shared.js
   ============================================================ */
console.log("[BOONDI] shared.js loading");
(function () {
  "use strict";
  try {

  var PACKET_G   = 150;
  var SHELF_DAYS = 30;
  var RATE       = 250;
  var CUR        = "Rs.";

  var API_URL = "https://script.google.com/macros/s/AKfycbyMphLZoy0P43BihVgzu-pmZ9QrYsX6roQosX_3GJW14KfcfdeS1_odaNxhJtMzJKz5/exec";
  var API_KEY = "sk_sweetops_8f3a1c9e2b7d4f6a";

  var CACHE_KEY      = "boondi_cache_v6";
  var CACHE_TIME_KEY = "boondi_cache_time_v6";
  var CACHE_MAX_AGE  = 10 * 60 * 1000;
  var REFRESH_DELAY  = 300;

  var CACHE = null;
  var currentUserId = null;
  var _refreshListeners = [];

  /* ---------- helpers ---------- */
  function dAgo(n){ var d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-n); return d; }
  function iso(d){ return d.toISOString(); }
  function fmtDate(s){ return new Date(s).toLocaleDateString("en-GB",{day:"2-digit",month:"short"}); }
  function fmtDT(s){ return new Date(s).toLocaleString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}); }
  function fmtTime(s){ return new Date(s).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}); }
  function fmtDay(s){
    var d = new Date(s);
    var today = new Date(); today.setHours(0,0,0,0);
    var yest = new Date(); yest.setDate(yest.getDate()-1); yest.setHours(0,0,0,0);
    var dd = new Date(d); dd.setHours(0,0,0,0);
    if (dd.getTime() === today.getTime()) return "Today";
    if (dd.getTime() === yest.getTime()) return "Yesterday";
    return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:d.getFullYear()!==today.getFullYear()?"numeric":undefined});
  }
  function fmtAgo(ts){
    if (!ts) return "";
    var s = Math.floor((Date.now()-ts)/1000);
    if (s < 45) return "just now";
    if (s < 90) return "1m ago";
    if (s < 3600) return Math.floor(s/60)+"m ago";
    if (s < 7200) return "1h ago";
    if (s < 86400) return Math.floor(s/3600)+"h ago";
    return Math.floor(s/86400)+"d ago";
  }
  function money(n){ return CUR + " " + Number(n).toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function num(n,d){ d=d||0; return Number(n).toLocaleString("en-LK",{minimumFractionDigits:d,maximumFractionDigits:d}); }

  var ICON = {
    home:'<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
    chart:'<path d="M3 13h2v7H3zm4-6h2v13H7zm4-4h2v17h-2zm4 6h2v11h-2zm4 4h2v7h-2z"/>',
    history:'<path d="M13 3a9 9 0 0 0-9 9H1l3.9 3.9.1.1L9 12H6a7 7 0 1 1 2 4.9l-1.4 1.4A9 9 0 1 0 13 3zm-1 5v5l4.3 2.5.7-1.2-3.5-2.1V8H12z"/>',
    logout:'<path d="M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z"/>',
    check:'<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>',
    warn:'<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
    truck:'<path d="M20 8h-3V4H3a2 2 0 0 0-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5l-3-4zM7.5 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM17 12V9.5h2.5l1.96 2.5H17z"/>',
    box:'<path d="M20 2H4a2 2 0 0 0-2 2v3.01A2 2 0 0 0 3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9c.67-.01 1-.45 1-1V4a2 2 0 0 0-2-2zm-9 14h-2v-4H7l3.5-4.5L14 12h-2v4zm7-9H4V4h14v3z"/>',
    cash:'<path d="M11.8 11c-2.3-.6-3-1.2-3-2.2 0-1.1 1-1.8 2.7-1.8 1.8 0 2.4.9 2.5 2.1h2.2c-.1-1.7-1.1-3.3-3.2-3.8V3h-3v2.2c-1.9.4-3.5 1.7-3.5 3.6 0 2.3 1.9 3.5 4.7 4.1 2.5.6 3 1.5 3 2.4 0 .7-.5 1.8-2.7 1.8-2.1 0-2.9-.9-3-2.1h-2.2c.1 2.2 1.8 3.4 3.7 3.8V21h3v-2.2c1.9-.4 3.5-1.5 3.5-3.6 0-2.8-2.4-3.8-4.7-4.4z"/>',
    person:'<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/>',
    add:'<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>',
    chev:'<path d="M9.3 6.7a1 1 0 0 0 0 1.4l3.9 3.9-3.9 3.9a1 1 0 1 0 1.4 1.4l4.6-4.6a1 1 0 0 0 0-1.4l-4.6-4.6a1 1 0 0 0-1.4 0z"/>',
    scale:'<path d="M12 3a2 2 0 0 1 1 3.7V9h5.5l2.5 6a4 4 0 0 1-7.5 2h-.5v2h4v2H7v-2h4v-2h-.5a4 4 0 0 1-7.5-2l2.5-6H11V6.7A2 2 0 0 1 12 3zm-4.5 8L5.8 14h5.4L9.5 11zm9 0-1.7 3h5.4l-1.7-3z"/>',
    refresh:'<path d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6a5.9 5.9 0 0 1 4.22 1.78L13 11h7V4l-2.35 2.35z"/>',
    download:'<path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/>',
    info:'<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>'
  };
  function icon(name,size){
    size = size || 20;
    return '<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="currentColor" aria-hidden="true">'+(ICON[name]||"")+'</svg>';
  }

  var USERS = [
    { id:"u1", name:"Pasan",    role:"supplier",    password:"pasan123" },
    { id:"u2", name:"Kalsara",  role:"supplier",    password:"kalsara123" },
    { id:"u3", name:"Daham",    role:"stockkeeper", password:"daham123" },
    { id:"u4", name:"Chaminda", role:"stockkeeper", password:"chaminda123" },
    { id:"u5", name:"Bura",     role:"seller",      password:"bura123" }
  ];

  /* ---------- cache ---------- */
  function _persist(){
    if (!CACHE) return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(CACHE));
      localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
    } catch(e){}
  }
  function _read(){
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      var ts = parseInt(localStorage.getItem(CACHE_TIME_KEY)||"0",10);
      if (!raw) return null;
      return { data:JSON.parse(raw), ts:ts, age:Date.now()-ts };
    } catch(e){ return null; }
  }
  function _clear(){
    try { localStorage.removeItem(CACHE_KEY); localStorage.removeItem(CACHE_TIME_KEY); } catch(e){}
  }
  function lastSync(){ var c = _read(); return c ? c.ts : 0; }
  function onRefresh(cb){ _refreshListeners.push(cb); }
  function _fire(){ for (var i=0;i<_refreshListeners.length;i++){ try{ _refreshListeners[i](); }catch(e){} } }

  /* ---------- API ---------- */
  function apiGet(action, extra){
    var url = API_URL + "?key=" + encodeURIComponent(API_KEY) + "&action=" + action + (extra||"");
    return fetch(url, { cache:"no-store" })
      .then(function(r){ return r.json(); })
      .then(function(j){ if (!j.ok) throw new Error(j.error || "API error"); return j; });
  }
  function apiPost(action, payload){
    var url = API_URL + "?key=" + encodeURIComponent(API_KEY);
    return fetch(url, {
      method:"POST",
      headers:{ "Content-Type":"text/plain;charset=utf-8" },
      body:JSON.stringify({ action:action, payload:payload, key:API_KEY })
    }).then(function(r){ return r.json(); })
      .then(function(j){ if (!j.ok) throw new Error(j.error || "API error"); return j; });
  }

  function _apply(j){
    CACHE = {
      purchases: j.purchases||[],
      packaging: j.packaging||[],
      transfers: j.transfers||[],
      sales:     j.sales||[],
      activity:  j.activity||[]
    };
    _persist();
    return CACHE;
  }
  function fetchFresh(){ return apiGet("getAll","&fresh=1&t="+Date.now()).then(_apply); }
  function loadAll(opts){
    opts = opts || {};
    if (opts.fresh) return fetchFresh();
    var cached = _read();
    if (cached && cached.age < CACHE_MAX_AGE){
      CACHE = cached.data;
      setTimeout(function(){
        fetchFresh().then(_fire).catch(function(e){ console.warn("[BOONDI] bg refresh", e.message); });
      }, REFRESH_DELAY);
      return Promise.resolve(CACHE);
    }
    return fetchFresh();
  }
  function getState(){ return CACHE || { purchases:[], packaging:[], transfers:[], sales:[], activity:[] }; }
  function refresh(){ return fetchFresh().then(function(){ _fire(); return CACHE; }); }

  /* ---------- session ---------- */
  var REMEMBER_KEY = "boondi_remember";
  var SESSION_KEY  = "boondi_uid";
  function setUser(u){ currentUserId=u.id; try{ sessionStorage.setItem(SESSION_KEY,u.id);}catch(e){} }
  function getUser(){
    var id = currentUserId;
    if (!id){ try{ id=sessionStorage.getItem(SESSION_KEY); }catch(e){} }
    if (!id) return null;
    currentUserId = id;
    return USERS.find(function(u){ return u.id===id; }) || null;
  }
  function requireUser(){
    var u = getUser();
    if (!u){ document.body.classList.add("leaving"); setTimeout(function(){ window.location.replace("index.html"); }, 150); return null; }
    return u;
  }
  function saveRemember(user,pw){ try{ localStorage.setItem(REMEMBER_KEY,JSON.stringify({id:user.id,pw:pw})); }catch(e){} }
  function clearRemember(){ try{ localStorage.removeItem(REMEMBER_KEY); }catch(e){} }
  function getRemember(){ try{ return JSON.parse(localStorage.getItem(REMEMBER_KEY)||"null"); }catch(e){ return null; } }
  function signOut(){
    currentUserId = null;
    try { sessionStorage.removeItem(SESSION_KEY); } catch(e){}
    clearRemember(); _clear();
    document.body.classList.add("leaving");
    setTimeout(function(){ window.location.href = "index.html"; }, 160);
  }

  function roleLabel(r){ return r==="supplier"?"Supplier":r==="stockkeeper"?"Stock keeper":"Seller"; }
  function roleHome(me){
    if (!me) return "index";
    return me.role==="supplier" ? "supplier"
         : me.role==="stockkeeper" ? "stockkeeper"
         : "seller";
  }

  /* ---------- animations ---------- */
  function animateNumbers(root){
    var scope = root || document;
    var els = scope.querySelectorAll('.stat .val, .stock-cell .sv');
    for (var i = 0; i < els.length; i++){
      (function(el){
        if (el._animated) return;
        el._animated = true;
        var originalHTML = el.innerHTML;
        var text = el.textContent || "";
        var m = text.match(/(-?[\d,]+(?:\.\d+)?)/);
        if (!m) return;
        var target = parseFloat(m[1].replace(/,/g, ""));
        if (isNaN(target)) return;
        if (target === 0){ return; }
        var dec = (m[1].split(".")[1] || "").length;
        var start = performance.now();
        var dur = Math.min(750, 260 + Math.abs(target) * 1.8);
        function tick(now){
          var t = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - t, 3);
          var v = target * eased;
          var fmt = v.toLocaleString("en-LK", {
            minimumFractionDigits: dec,
            maximumFractionDigits: dec
          });
          el.innerHTML = originalHTML.replace(m[1], fmt);
          if (t < 1) requestAnimationFrame(tick);
          else el.innerHTML = originalHTML;
        }
        requestAnimationFrame(tick);
      })(els[i]);
    }
  }

  function btnBusy(btn, label){
    if (!btn) return;
    if (btn._origHTML === undefined) btn._origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add("busy");
    if (btn.classList.contains("iconbtn")) return;
    btn.innerHTML = '<span class="btn-spinner"></span>' + (label || "Working…");
  }
  function btnDone(btn, label){
    if (!btn) return;
    btn.classList.remove("busy");
    btn.classList.add("done");
    if (!btn.classList.contains("iconbtn")){
      btn.innerHTML = "✓ " + (label || "Done");
    }
    setTimeout(function(){ btnFail(btn); }, 900);
  }
  function btnFail(btn){
    if (!btn) return;
    btn.classList.remove("busy", "done");
    btn.disabled = false;
    if (btn._origHTML !== undefined) btn.innerHTML = btn._origHTML;
    btn._origHTML = undefined;
  }

  /* ---------- prediction ---------- */
  function dailyCounts(sales, days){
    var arr = [];
    for (var i = days-1; i >= 0; i--){
      var d = dAgo(i), key = d.toDateString(), qty = 0;
      for (var j=0;j<sales.length;j++){
        if (new Date(sales[j].date).toDateString() === key) qty += Number(sales[j].packets);
      }
      arr.push({ date:d, qty:qty, label:d.toLocaleDateString("en-GB",{weekday:"short"}) });
    }
    return arr;
  }
  function weightedAvg(sales, days){
    var counts = dailyCounts(sales, days);
    var wSum = 0, sum = 0;
    for (var i = 0; i < counts.length; i++){
      var recency = counts.length - 1 - i;
      var w = Math.pow(0.82, recency);
      sum += counts[i].qty * w; wSum += w;
    }
    return wSum > 0 ? sum/wSum : 0;
  }
  function stdDev(values){
    if (!values.length) return 0;
    var mean = values.reduce(function(a,b){ return a+b; },0)/values.length;
    var variance = values.reduce(function(a,b){ return a + Math.pow(b-mean,2); },0)/values.length;
    return Math.sqrt(variance);
  }

  function calc(){
    var s = getState();
    function conf(a){ return a.filter(function(x){ return x.status==="Confirmed"; }); }

    var cP = conf(s.purchases);
    var kgBought = cP.reduce(function(a,p){ return a+Number(p.kg); },0);
    var costBought = cP.reduce(function(a,p){ return a+Number(p.kg)*Number(p.costPerKg); },0);
    var avgCostKg = kgBought ? costBought/kgBought : 0;

    var cK = conf(s.packaging);
    var packetsMade = cK.reduce(function(a,p){ return a+Number(p.packets); },0);
    var kgPacked = packetsMade * PACKET_G / 1000;
    var jenningsKg = Math.max(0, kgBought - kgPacked);

    var cT = conf(s.transfers);
    var packetsSent = cT.reduce(function(a,t){ return a+Number(t.packets); },0);
    var jenningsPackets = packetsMade - packetsSent;

    var packetsSold = s.sales.reduce(function(a,x){ return a+Number(x.packets); },0);
    var nishmiPackets = packetsSent - packetsSold;

    var revenue = s.sales.reduce(function(a,x){ return a+Number(x.revenue); },0);
    var cogs    = s.sales.reduce(function(a,x){ return a+Number(x.cogs); },0);
    var profit  = revenue - cogs;
    var cpp = packetsMade ? (kgPacked*avgCostKg)/packetsMade : 0;

    var intakes = conf(s.purchases).sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
    var runs = conf(s.packaging).sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
    var losses = [];
    for (var i=0; i<intakes.length; i++){
      var intake = intakes[i], next = intakes[i+1];
      var inWindow = runs.filter(function(k){
        var kt = new Date(k.date).getTime(), st = new Date(intake.date).getTime();
        var en = next ? new Date(next.date).getTime() : Infinity;
        return kt >= st && kt < en;
      });
      var pkts = inWindow.reduce(function(a,k){ return a+Number(k.packets); },0);
      var usedKg = pkts * PACKET_G / 1000;
      var lostKg = Math.max(0, Number(intake.kg) - usedKg);
      if (pkts > 0 || next){
        losses.push({
          intakeId:intake.id, intakeKg:Number(intake.kg),
          packetsUsed:pkts, usedKg:usedKg, lossKg:lostKg,
          lossPct:intake.kg ? (lostKg/intake.kg)*100 : 0,
          supplier:intake.supplier, date:intake.date
        });
      }
    }
    var totalLossKg = losses.reduce(function(a,l){ return a+l.lossKg; },0);

    var counts7 = dailyCounts(s.sales, 7);
    var counts14 = dailyCounts(s.sales, 14);
    var weekSold = counts7.reduce(function(a,d){ return a+d.qty; },0);
    var prevWeekSold = counts14.slice(0,7).reduce(function(a,d){ return a+d.qty; },0);
    var avgDaily = weightedAvg(s.sales, 7);
    var volatility = stdDev(counts14.map(function(d){ return d.qty; }));
    var trend = prevWeekSold > 0 ? ((weekSold-prevWeekSold)/prevWeekSold)*100 : (weekSold>0?100:0);

    var safetyStock = Math.ceil(1.65 * volatility);
    var reorderPoint = Math.ceil(avgDaily + safetyStock);

    var nishmiDays = avgDaily > 0 ? nishmiPackets/avgDaily : Infinity;
    var jenningsDays = avgDaily > 0 ? jenningsPackets/avgDaily : Infinity;
    var rawDays = avgDaily > 0 ? jenningsKg / ((avgDaily*PACKET_G)/1000) : Infinity;

    var stockoutDate = null;
    if (avgDaily > 0 && nishmiPackets > 0){
      var d = new Date(); d.setDate(d.getDate() + Math.floor(nishmiPackets/avgDaily));
      stockoutDate = d;
    }

    var needTransfer = Math.max(0, reorderPoint - nishmiPackets);
    var packTarget = avgDaily > 0 ? Math.ceil(avgDaily * 7) : 0;
    var kgToOrder = avgDaily > 0
      ? Math.max(0, Math.ceil(((packTarget + Math.ceil(avgDaily*3))*PACKET_G)/1000) - jenningsKg)
      : 0;

    return {
      kgBought:kgBought, costBought:costBought, avgCostKg:avgCostKg,
      kgPacked:kgPacked, packetsMade:packetsMade,
      lossKg:totalLossKg, losses:losses,
      jenningsKg:jenningsKg, packetsSent:packetsSent, jenningsPackets:jenningsPackets,
      packetsSold:packetsSold, nishmiPackets:nishmiPackets,
      revenue:revenue, cogs:cogs, profit:profit, cpp:cpp,
      days:counts7, weekSold:weekSold, prevWeekSold:prevWeekSold,
      avgDaily:avgDaily, volatility:volatility, trend:trend,
      nishmiDays:nishmiDays, jenningsDays:jenningsDays, rawDays:rawDays,
      stockoutDate:stockoutDate,
      reorderPoint:reorderPoint, safetyStock:safetyStock,
      needTransfer:needTransfer, packTarget:packTarget, kgToOrder:kgToOrder,
      pendingPurchases: s.purchases.filter(function(p){ return p.status==="Pending"; }),
      pendingPackaging: s.packaging.filter(function(p){ return p.status==="Pending"; }),
      pendingTransfers: s.transfers.filter(function(t){ return t.status==="Pending"; })
    };
  }

  /* ---------- announcements ---------- */
  function announcements(me, c){
    var list = [];
    var pending = pendingForUser(me);

    if (pending.length){
      list.push({
        cls:"warn", icon:"warn",
        title: pending.length + " item" + (pending.length>1?"s":"") + " need your confirmation",
        body: "Tap Activity to review and confirm."
      });
    }
    if (c.nishmiPackets === 0){
      list.push({ cls:"crit", icon:"warn", title:"Nishmi is out of packets",
        body: me.role==="stockkeeper" ? "Send packets from Jennings immediately."
            : me.role==="supplier" ? "Nothing to sell — chain is blocked."
            : "Nothing to sell. Ask Jennings to transfer now." });
    } else if (c.nishmiDays < 2){
      list.push({ cls:"crit", icon:"warn", title:"Nishmi stock under 2 days",
        body: "Only " + c.nishmiDays.toFixed(1) + " days left — transfer " + c.needTransfer + " packets." });
    } else if (c.nishmiDays < 4){
      list.push({ cls:"warn", icon:"truck", title:"Nishmi will need restock soon",
        body: "About " + c.nishmiDays.toFixed(1) + " days left. Plan to send " + c.needTransfer + " packets." });
    }
    if (c.jenningsKg < 30 && me.role !== "seller"){
      list.push({ cls:"warn", icon:"scale", title:"Raw sweets running low",
        body: "Jennings has " + num(c.jenningsKg,1) + " kg — order " + Math.max(5, Math.ceil(c.kgToOrder)) + " kg." });
    }
    if (c.jenningsPackets < 60 && me.role === "stockkeeper"){
      list.push({ cls:"warn", icon:"box", title:"Pack more at Jennings",
        body: "Only " + c.jenningsPackets + " packets. Pack " + Math.max(20, c.packTarget) + " this week." });
    }

    if (!list.length){
      list.push({ cls:"good", icon:"check", title:"Everything looks healthy",
        body: me.role==="supplier" ? "Chain is well stocked. Keep an eye on the dashboard."
            : me.role==="stockkeeper" ? "Stock levels are balanced. Nothing to do right now."
            : "Nishmi has enough stock. Keep selling." });
    }
    return list;
  }
  function announcementsBlock(me, c){
    return announcements(me, c).map(function(a){
      return '<div class="ann '+a.cls+'">' +
        '<span class="ann-ic">'+icon(a.icon,22)+'</span>' +
        '<div class="ann-body">' +
          '<span class="ann-t">'+a.title+'</span>' +
          '<span class="ann-b">'+a.body+'</span>' +
        '</div></div>';
    }).join("");
  }

  function stockStrip(c){
    return '<div class="stock-strip">' +
      '<div class="stock-cell dark">' +
        '<div class="sl">Jennings · raw</div>' +
        '<div class="sv">'+num(c.jenningsKg,1)+'<small>kg</small></div>' +
        '<div class="ss">'+(c.rawDays===Infinity?'—':c.rawDays.toFixed(1)+'d cover')+'</div>' +
      '</div>' +
      '<div class="stock-cell">' +
        '<div class="sl">Jennings · packets</div>' +
        '<div class="sv">'+num(c.jenningsPackets)+'</div>' +
        '<div class="ss">'+(c.jenningsDays===Infinity?'—':c.jenningsDays.toFixed(1)+'d cover')+'</div>' +
      '</div>' +
      '<div class="stock-cell">' +
        '<div class="sl">Nishmi · packets</div>' +
        '<div class="sv">'+num(c.nishmiPackets)+'</div>' +
        '<div class="ss">'+(c.nishmiDays===Infinity?'—':c.nishmiDays.toFixed(1)+'d cover')+'</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- perms ---------- */
  function canConfirm(kind, createdBy, me){
    if (!me || createdBy===me.name) return false;
    if (kind==="purchase") return me.role==="stockkeeper";
    if (kind==="packaging") return me.role==="stockkeeper";
    if (kind==="transfer") return me.role==="seller";
    return false;
  }
  function pendingForUser(me){
    if (!me) return [];
    var s = getState(), out = [];
    if (me.role==="stockkeeper"){
      s.purchases.filter(function(p){ return p.status==="Pending" && p.supplier!==me.name; })
        .forEach(function(p){ out.push({kind:"purchase",id:p.id}); });
      s.packaging.filter(function(k){ return k.status==="Pending" && k.by!==me.name; })
        .forEach(function(k){ out.push({kind:"packaging",id:k.id}); });
    }
    if (me.role==="seller"){
      s.transfers.filter(function(t){ return t.status==="Pending" && t.by!==me.name; })
        .forEach(function(t){ out.push({kind:"transfer",id:t.id}); });
    }
    return out;
  }
  function itemOf(kind, id){
    var s = getState();
    if (kind==="purchase"){
      var p = s.purchases.find(function(x){ return x.id===id; });
      if (!p) return null;
      return { kind:kind, id:id, icon:"truck", title:"Intake received?",
        sub:"A delivery is waiting for your confirmation.",
        rows:[["Reference",p.id],["From",p.supplier],["Weight",num(p.kg,1)+" kg"],["Value",money(p.kg*p.costPerKg)],["Arrived",fmtDT(p.date)]],
        effect:"This will add <b>"+num(p.kg,1)+" kg</b> to Jennings raw stock.",
        createdBy:p.supplier };
    }
    if (kind==="packaging"){
      var k = s.packaging.find(function(x){ return x.id===id; });
      if (!k) return null;
      var used = Number(k.packets)*PACKET_G/1000;
      return { kind:kind, id:id, icon:"box", title:"Packaging confirmation",
        sub:"Another stock keeper recorded a packaging run.",
        rows:[["Reference",k.id],["Packed by",k.by],["Packets",k.packets],["Raw used",num(used,2)+" kg"]],
        effect:"This will add <b>"+k.packets+" packets</b> to Jennings and consume <b>"+num(used,2)+" kg</b> raw.",
        createdBy:k.by };
    }
    if (kind==="transfer"){
      var t = s.transfers.find(function(x){ return x.id===id; });
      if (!t) return null;
      return { kind:kind, id:id, icon:"truck", title:"Transfer received?",
        sub:"Packets were sent from Jennings to Nishmi.",
        rows:[["Reference",t.id],["Sent by",t.by],["Packets",t.packets],["Sent",fmtDT(t.date)]],
        effect:"This will add <b>"+t.packets+" packets</b> to Nishmi stock.",
        createdBy:t.by };
    }
    return null;
  }

  /* ---------- mutations ---------- */
  function log(who, kind, text){
    var entry = { at:new Date().toISOString(), who:who, kind:kind, text:text };
    apiPost("logActivity", entry).catch(function(e){ console.warn("[BOONDI] logActivity", e.message); });
    getState().activity.unshift(entry);
    _persist();
  }
  function nextId(prefix, list){ return prefix + (1000 + list.length + 1); }

  function addPurchase(me, kg, cost){
    var p = { id:nextId("P-",getState().purchases), date:new Date().toISOString(),
              supplier:me.name, kg:kg, costPerKg:cost,
              status:"Pending", confirmedBy:"", confirmedAt:"" };
    return apiPost("addPurchase", p).then(function(){
      getState().purchases.push(p);
      _persist();
      log(me.name, "purchase", "Recorded "+num(kg,1)+" kg — pending");
    });
  }
  function addPackaging(me, packets){
    var k = { id:nextId("K-",getState().packaging), date:new Date().toISOString(),
              by:me.name, packets:packets,
              status:"Pending", confirmedBy:"", confirmedAt:"" };
    return apiPost("addPackaging", k).then(function(){
      getState().packaging.push(k);
      _persist();
      log(me.name, "packaging", "Packed "+packets+" packets — pending");
    });
  }
  function addTransfer(me, packets){
    var t = { id:nextId("T-",getState().transfers), date:new Date().toISOString(),
              packets:packets, by:me.name,
              status:"Pending", confirmedBy:"", confirmedAt:"" };
    return apiPost("addTransfer", t).then(function(){
      getState().transfers.push(t);
      _persist();
      log(me.name, "transfer", "Sent "+packets+" packets — pending");
    });
  }
  function confirmItem(kind, id, me){
    var when = new Date().toISOString();
    return apiPost("confirmItem", { kind:kind, id:id, by:me.name, at:when }).then(function(){
      var tab = kind==="purchase"?"purchases":kind==="packaging"?"packaging":"transfers";
      var item = getState()[tab].find(function(x){ return x.id===id; });
      if (item){ item.status="Confirmed"; item.confirmedBy=me.name; item.confirmedAt=when; }
      _persist();
      var text = kind==="purchase"?"Confirmed intake "+id
               : kind==="packaging"?"Confirmed "+(item?item.packets:"")+" packets"
               : "Received "+(item?item.packets:"")+" packets at Nishmi";
      log(me.name, kind, text);
    });
  }
  function addSale(me, packets, unitPrice){
    var c = calc();
    var revenue = packets*unitPrice;
    var cogs = packets*c.cpp;
    var s = { id:nextId("S-",getState().sales), date:new Date().toISOString(),
              by:me.name, packets:packets, unitPrice:unitPrice,
              revenue:revenue, cogs:cogs, profit:revenue-cogs };
    return apiPost("addSale", s).then(function(){
      getState().sales.push(s);
      _persist();
      log(me.name, "sale", "Sold "+packets+" packets — "+money(revenue));
    });
  }

  /* ---------- toast ---------- */
  function toast(msg){
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function(){ el.classList.remove("show"); }, 2400);
  }

  /* ---------- nav ---------- */
  var PAGE = "";
  function setPage(p){ PAGE = p; }
  function isPage(p){ return PAGE===p; }
  function goPage(p){
    if (isPage(p)) return;
    document.body.classList.add("leaving");
    setTimeout(function(){ window.location.href = p + ".html"; }, 140);
  }

  /* ============================================================
     APPBAR — brand · centered nav pill · actions
     (nav pill visible only on desktop via CSS)
     ============================================================ */
  function appBar(me){
    var pending = pendingForUser(me);
    var home = roleHome(me);

    var items = [
      { id:home,       label:"Home",     icon:"home" },
      { id:"reports",  label:"Reports",  icon:"chart" },
      { id:"activity", label:"Activity", icon:"history", badge:pending.length }
    ];

    var navButtons = items.map(function(it){
      var on = isPage(it.id);
      return '<button class="appbar-nav-btn '+(on?'on':'')+'" data-nav="'+it.id+'">' +
        icon(it.icon, 15) +
        '<span>'+it.label+'</span>' +
        (it.badge ? '<span class="appbar-nav-badge">'+it.badge+'</span>' : '') +
      '</button>';
    }).join('');

    return '<header class="appbar"><div class="appbar-in">' +
      '<div class="brand">' +
        '<span class="mark">b</span>' +
        '<div><div class="brand-name">BOONDI</div><div class="brand-sub">Jennings · Nishmi</div></div>' +
      '</div>' +
      '<nav class="appbar-nav">'+navButtons+'</nav>' +
      '<div class="appbar-actions">' +
        '<button class="iconbtn" data-refresh title="Refresh" aria-label="Refresh">'+icon("refresh",18)+'</button>' +
        '<div class="who">' +
          '<div class="who-txt">' +
            '<div class="who-name">'+me.name+'</div>' +
            '<div class="who-role">'+roleLabel(me.role)+'</div>' +
          '</div>' +
          '<span class="ava">'+me.name[0]+'</span>' +
        '</div>' +
        '<button class="iconbtn" data-logout title="Sign out" aria-label="Sign out">'+icon("logout",18)+'</button>' +
      '</div>' +
    '</div></header>';
  }

  /* ---------- mobile dock (bottom) ---------- */
  function dock(me, pendingCount){
    var home = roleHome(me);
    var items = [
      { id:home,       label:"Home",     icon:"home" },
      { id:"reports",  label:"Reports",  icon:"chart" },
      { id:"activity", label:"Activity", icon:"history", badge:pendingCount }
    ];
    return '<nav class="dock">' + items.map(function(it){
      var on = isPage(it.id);
      return '<button class="dock-btn '+(on?'on':'')+'" data-nav="'+it.id+'">' +
        icon(it.icon, 17) +
        '<span>'+it.label+'</span>' +
        (it.badge ? '<span class="dock-badge">'+it.badge+'</span>' : '') +
      '</button>';
    }).join('') + '</nav>';
  }

  function loadingView(){
    return '<div class="head">' +
      '<div class="skel title" style="margin-bottom:8px"></div>' +
      '<div class="skel sub"></div>' +
    '</div>' +
    '<div class="stock-strip" style="margin-bottom:16px">' +
      '<div class="stock-cell dark"><div class="sl">Jennings · raw</div><div class="sv"><span class="skel-num"></span></div><div class="ss">Loading…</div></div>' +
      '<div class="stock-cell"><div class="sl">Jennings · packets</div><div class="sv"><span class="skel-num"></span></div><div class="ss">Loading…</div></div>' +
      '<div class="stock-cell"><div class="sl">Nishmi · packets</div><div class="sv"><span class="skel-num"></span></div><div class="ss">Loading…</div></div>' +
    '</div>' +
    '<div class="grid g4" style="margin-bottom:16px">' +
      '<div class="skel" style="height:96px"></div>' +
      '<div class="skel" style="height:96px"></div>' +
      '<div class="skel" style="height:96px"></div>' +
    '</div>' +
    '<div class="skel" style="height:180px"></div>';
  }

  function errorView(errMsg){
    return '<div style="padding:60px 20px;text-align:center;max-width:400px;margin:0 auto">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:var(--paper-2);display:grid;place-items:center;margin:0 auto 16px">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="#222"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>' +
      '</div>' +
      '<h2 style="margin-bottom:8px">Could not load</h2>' +
      '<p style="color:var(--ink-2);font-size:13.5px;margin-bottom:20px">'+errMsg+'</p>' +
      '<button class="btn btn-solid" onclick="location.reload()">Retry</button>' +
    '</div>';
  }

  /* ---------- modal ---------- */
  var modal = { item:null, step:1, queue:[], onDone:null };
  function showConfirmModal(kind, id, onDone){
    var me = getUser();
    var it = itemOf(kind, id);
    if (!it) return;
    if (!canConfirm(kind, it.createdBy, me)) return toast("You cannot confirm this");
    modal.item = it; modal.step = 1; modal.queue = []; modal.onDone = onDone;
    renderModal();
  }
  function showConfirmQueue(onDone){
    var me = getUser();
    var q = pendingForUser(me);
    if (!q.length) return toast("Nothing waiting");
    modal.queue = q.slice(); modal.onDone = onDone;
    advance();
  }
  function advance(){
    var next = modal.queue.shift();
    if (!next){ closeModal(); if (modal.onDone) modal.onDone(); return; }
    var it = itemOf(next.kind, next.id);
    if (!it) return advance();
    modal.item = it; modal.step = 1;
    renderModal();
  }
  function renderModal(){
    var existing = document.querySelector(".scrim");
    if (existing) existing.remove();
    if (!modal.item) return;
    var it = modal.item;
    var scrim = document.createElement("div");
    scrim.className = "scrim";

    if (modal.step===1){
      var rows = it.rows.map(function(r){
        return '<div><span class="k">'+r[0]+'</span><b>'+r[1]+'</b></div>';
      }).join("");
      scrim.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' +
        '<div class="ic-badge">'+icon(it.icon,22)+'</div>' +
        '<h2>'+it.title+'</h2>' +
        '<p>'+it.sub+'</p>' +
        '<div class="detail">'+rows+'</div>' +
        '<div class="actions">' +
          '<button class="btn btn-ghost" data-modal-notyet>Not yet</button>' +
          '<button class="btn btn-solid" data-modal-next>I confirm</button>' +
        '</div></div>';
    } else {
      scrim.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' +
        '<div class="ic-badge">'+icon("warn",22)+'</div>' +
        '<h2>Double check</h2>' +
        '<p>'+it.effect+'</p>' +
        '<p><b>This cannot be undone.</b> Make sure the numbers match what you physically have.</p>' +
        '<div class="actions">' +
          '<button class="btn btn-out" data-modal-back>Go back</button>' +
          '<button class="btn btn-solid" data-modal-apply>Yes, confirm</button>' +
        '</div></div>';
    }
    document.body.appendChild(scrim);
  }
  function closeModal(){
    modal.item = null; modal.step = 1; modal.queue = [];
    var s = document.querySelector(".scrim");
    if (s) s.remove();
  }

  /* ---------- CSV export ---------- */
  function downloadCSV(filename, rows){
    var csv = rows.map(function(r){
      return r.map(function(c){
        var v = c==null ? "" : String(c);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g,'""') + '"' : v;
      }).join(",");
    }).join("\n");
    var blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }
  function exportReports(){
    var c = calc();
    var s = getState();
    var rows = [["BOONDI report", new Date().toISOString().slice(0,10)]];
    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Revenue", c.revenue]);
    rows.push(["COGS", c.cogs]);
    rows.push(["Profit", c.profit]);
    rows.push(["Packets sold", c.packetsSold]);
    rows.push(["Avg daily (weighted)", c.avgDaily.toFixed(2)]);
    rows.push(["Volatility", c.volatility.toFixed(2)]);
    rows.push(["Reorder point", c.reorderPoint]);
    rows.push([]);
    rows.push(["Stock"]);
    rows.push(["Jennings raw (kg)", c.jenningsKg.toFixed(2)]);
    rows.push(["Jennings packets", c.jenningsPackets]);
    rows.push(["Nishmi packets", c.nishmiPackets]);
    rows.push([]);
    rows.push(["Sales detail"]);
    rows.push(["ID","Date","By","Packets","Unit price","Revenue","COGS","Profit"]);
    s.sales.forEach(function(x){
      rows.push([x.id, x.date, x.by, x.packets, x.unitPrice, x.revenue, x.cogs, x.profit]);
    });
    downloadCSV("boondi-"+new Date().toISOString().slice(0,10)+".csv", rows);
  }

  /* ---------- global listeners ---------- */
  document.addEventListener("click", function(e){
    var el = e.target;
    while (el && el !== document){
      if (el.matches){
        if (el.matches("[data-logout]")) return signOut();
        if (el.matches("[data-nav]")) return goPage(el.getAttribute("data-nav"));
        if (el.matches("[data-refresh]")){
          var rBtn = el;
          btnBusy(rBtn);
          refresh().then(function(){
            btnDone(rBtn);
            toast("Up to date");
          }).catch(function(err){
            btnFail(rBtn);
            toast("Failed: "+err.message);
          });
          return;
        }
        if (el.matches("[data-modal-next]")){ modal.step=2; return renderModal(); }
        if (el.matches("[data-modal-back]")){ modal.step=1; return renderModal(); }
        if (el.matches("[data-modal-apply]")){
          var applyBtn = el;
          btnBusy(applyBtn, "Confirming…");
          var me = getUser();
          confirmItem(modal.item.kind, modal.item.id, me).then(function(){
            btnDone(applyBtn, "Confirmed");
            setTimeout(function(){ advance(); }, 550);
          }).catch(function(err){
            btnFail(applyBtn);
            toast("Failed: "+err.message);
          });
          return;
        }
        if (el.matches("[data-modal-notyet]")){
          toast("Kept as pending"); return advance();
        }
        if (el.classList && el.classList.contains("scrim") && el === e.target) return closeModal();
      }
      el = el.parentNode;
    }
  });

  /* ---------- expose ---------- */
  window.SweetOps = {
    PACKET_G:PACKET_G, SHELF_DAYS:SHELF_DAYS, RATE:RATE, CUR:CUR,
    users:USERS,
    loadAll:loadAll, refresh:refresh, onRefresh:onRefresh, lastSync:lastSync,
    getState:getState, calc:calc,
    announcements:announcements, announcementsBlock:announcementsBlock,
    stockStrip:stockStrip,
    canConfirm:canConfirm, pendingForUser:pendingForUser, itemOf:itemOf,
    addPurchase:addPurchase, addPackaging:addPackaging, addTransfer:addTransfer,
    confirmItem:confirmItem, addSale:addSale, log:log, toast:toast,
    animateNumbers:animateNumbers, btnBusy:btnBusy, btnDone:btnDone, btnFail:btnFail,
    icon:icon, money:money, num:num,
    fmtDate:fmtDate, fmtDT:fmtDT, fmtTime:fmtTime, fmtDay:fmtDay, fmtAgo:fmtAgo,
    dAgo:dAgo, iso:iso,
    roleLabel:roleLabel, roleHome:roleHome,
    setUser:setUser, getUser:getUser, requireUser:requireUser, signOut:signOut,
    saveRemember:saveRemember, clearRemember:clearRemember, getRemember:getRemember,
    appBar:appBar, dock:dock, loadingView:loadingView, errorView:errorView,
    setPage:setPage, isPage:isPage, goPage:goPage,
    showConfirmModal:showConfirmModal, showConfirmQueue:showConfirmQueue, closeModal:closeModal,
    downloadCSV:downloadCSV, exportReports:exportReports
  };
  window.A = window.SweetOps;

  console.log("[BOONDI] shared.js loaded");
  } catch (err) {
    console.error("[BOONDI] shared.js crashed:", err);
    document.body.innerHTML =
      '<div style="padding:32px;max-width:600px;margin:0 auto;font-family:system-ui">' +
        '<h2 style="margin:0 0 12px">BOONDI failed to load</h2>' +
        '<p style="color:#666">Open F12 → Console for details.</p>' +
        '<pre style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:16px;white-space:pre-wrap;font-size:12px">' +
          (err.message || err) + '\n\n' + (err.stack || '') +
        '</pre></div>';
  }
})();