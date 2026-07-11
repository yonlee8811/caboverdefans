/* ============================================
   Cabo Verde Fans — 10 islands interactive map
   Requires Google Maps JavaScript API.
   The map div: <div id="islands-map" data-lang="ja"></div>
   Loaded with callback=initIslandsMap
   ============================================ */

var CVF_ISLANDS = [
  { id: "santo-antao",  lat: 17.07,  lng: -25.17,
    ja: { name: "サント・アンタン", desc: "緑の渓谷とトレッキングの聖地" },
    en: { name: "Santo Antão", desc: "Green valleys and legendary hiking trails" },
    zh: { name: "圣安唐", desc: "绿色峡谷与徒步圣地" },
    q: "Santo Antão Cape Verde", group: "B" },
  { id: "sao-vicente",  lat: 16.865, lng: -24.96,
    ja: { name: "サン・ヴィセンテ", desc: "音楽の都ミンデロがある文化の島" },
    en: { name: "São Vicente", desc: "Home of Mindelo, the music capital" },
    zh: { name: "圣维森特", desc: "音乐之都明德卢所在的文化之岛" },
    q: "São Vicente Cape Verde", group: "B" },
  { id: "santa-luzia",  lat: 16.76,  lng: -24.745,
    ja: { name: "サンタ・ルジア", desc: "唯一の無人島・自然保護区" },
    en: { name: "Santa Luzia", desc: "Uninhabited nature reserve" },
    zh: { name: "圣卢西亚", desc: "唯一的无人岛·自然保护区" },
    q: "Santa Luzia Cape Verde", group: "B" },
  { id: "sao-nicolau",  lat: 16.61,  lng: -24.28,
    ja: { name: "サン・ニコラウ", desc: "素朴な山岳風景が残る静かな島" },
    en: { name: "São Nicolau", desc: "Quiet mountain landscapes" },
    zh: { name: "圣尼古拉", desc: "保留质朴山地风光的宁静之岛" },
    q: "São Nicolau Cape Verde", group: "B" },
  { id: "sal",          lat: 16.72,  lng: -22.93,
    ja: { name: "サル", desc: "白砂ビーチとリゾートの玄関口" },
    en: { name: "Sal", desc: "White-sand beaches and resort gateway" },
    zh: { name: "萨尔", desc: "白沙海滩与度假胜地的门户" },
    q: "Sal Cape Verde", group: "B" },
  { id: "boa-vista",    lat: 16.10,  lng: -22.80,
    ja: { name: "ボア・ヴィスタ", desc: "砂丘とアカウミガメの産卵地" },
    en: { name: "Boa Vista", desc: "Dunes and loggerhead turtle beaches" },
    zh: { name: "博阿维斯塔", desc: "沙丘与红海龟的产卵地" },
    q: "Boa Vista Cape Verde", group: "B" },
  { id: "maio",         lat: 15.22,  lng: -23.16,
    ja: { name: "マイオ", desc: "手つかずのビーチが続くのんびり島" },
    en: { name: "Maio", desc: "Slow island life, untouched beaches" },
    zh: { name: "马约", desc: "拥有原始海滩的悠闲之岛" },
    q: "Maio Cape Verde", group: "S" },
  { id: "santiago",     lat: 15.08,  lng: -23.63,
    ja: { name: "サンティアゴ", desc: "首都プライアと世界遺産シダーデ・ヴェーリャ" },
    en: { name: "Santiago", desc: "Praia and UNESCO-listed Cidade Velha" },
    zh: { name: "圣地亚哥", desc: "首都普拉亚与世界遗产旧城" },
    q: "Santiago Island Cape Verde", group: "S" },
  { id: "fogo",         lat: 14.93,  lng: -24.38,
    ja: { name: "フォゴ", desc: "標高2,829mの活火山ピコ・ド・フォゴ" },
    en: { name: "Fogo", desc: "Pico do Fogo, active volcano (2,829 m)" },
    zh: { name: "福戈", desc: "海拔2,829米的活火山福戈峰" },
    q: "Fogo Cape Verde", group: "S" },
  { id: "brava",        lat: 14.85,  lng: -24.72,
    ja: { name: "ブラヴァ", desc: "「花の島」と呼ばれる最小の有人島" },
    en: { name: "Brava", desc: "The 'island of flowers'" },
    zh: { name: "布拉瓦", desc: "被称为「鲜花之岛」的最小有人岛" },
    q: "Brava Cape Verde", group: "S" }
];

var cvfMap = null;
var cvfMarkers = {};
var cvfInfoWindow = null;
var cvfLang = "ja";

function initIslandsMap() {
  var el = document.getElementById("islands-map");
  if (!el) return;
  var dl = el.getAttribute("data-lang");
  cvfLang = dl === "en" ? "en" : dl === "zh" ? "zh" : "ja";

  cvfMap = new google.maps.Map(el, {
    mapTypeId: "terrain",
    gestureHandling: "cooperative",
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
      { featureType: "water", elementType: "geometry",
        stylers: [{ color: "#8fd0ec" }] }
    ]
  });

  cvfInfoWindow = new google.maps.InfoWindow();
  var bounds = new google.maps.LatLngBounds();

  CVF_ISLANDS.forEach(function (isl) {
    var pos = { lat: isl.lat, lng: isl.lng };
    bounds.extend(pos);

    var marker = new google.maps.Marker({
      position: pos,
      map: cvfMap,
      title: isl[cvfLang].name,
      label: {
        text: isl[cvfLang].name,
        fontSize: "12px",
        fontWeight: "bold",
        color: "#123a63"
      }
    });

    marker.addListener("click", function () {
      openIslandInfo(isl, marker);
    });

    cvfMarkers[isl.id] = marker;
  });

  cvfMap.fitBounds(bounds, 40);
}

function openIslandInfo(isl, marker) {
  var mapsUrl = "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(isl.q);
  var openLabel = cvfLang === "en" ? "Open in Google Maps" : cvfLang === "zh" ? "在Google地图中打开" : "Googleマップで開く";
  var detailLabel = cvfLang === "en" ? "Island guide" : cvfLang === "zh" ? "本岛指南" : "この島のガイド";
  var detailUrl = "/" + cvfLang + "/islands/" + isl.id + ".html";
  var html =
    '<div style="font-family:sans-serif; max-width:220px;">' +
    '<div style="font-weight:bold; font-size:14px; color:#123a63;">' +
    isl[cvfLang].name + "</div>" +
    '<div style="font-size:12px; color:#40597a; margin:4px 0 8px;">' +
    isl[cvfLang].desc + "</div>" +
    '<a href="' + detailUrl + '" ' +
    'style="font-size:12px; color:#d6362f; font-weight:bold; display:block; margin-bottom:4px;">' +
    detailLabel + " &#8594;</a>" +
    '<a href="' + mapsUrl + '" target="_blank" rel="noopener" ' +
    'style="font-size:12px; color:#0b5aa5; font-weight:bold;">' +
    openLabel + " &#8599;</a></div>";
  cvfInfoWindow.setContent(html);
  cvfInfoWindow.open(cvfMap, marker);
}

/* Island cards → pan map (連動) */
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".island[data-island]").forEach(function (card) {
    card.style.cursor = "pointer";
    card.addEventListener("click", function () {
      if (!cvfMap) return;
      var id = card.getAttribute("data-island");
      var isl = CVF_ISLANDS.find(function (i) { return i.id === id; });
      var marker = cvfMarkers[id];
      if (!isl || !marker) return;
      document.getElementById("islands-map")
        .scrollIntoView({ behavior: "smooth", block: "center" });
      cvfMap.panTo(marker.getPosition());
      if (cvfMap.getZoom() < 10) cvfMap.setZoom(10);
      openIslandInfo(isl, marker);
    });
  });
});

/* API key failure fallback */
window.gm_authFailure = function () {
  var el = document.getElementById("islands-map");
  if (!el) return;
  var l = document.documentElement.lang;
  var msg = (l === "en")
    ? 'Map could not be loaded. <a href="https://www.google.com/maps/search/?api=1&query=Cape+Verde" target="_blank" rel="noopener">Open Cabo Verde in Google Maps &#8599;</a>'
    : l === "zh" ? '地图加载失败。<a href="https://www.google.com/maps/search/?api=1&query=Cape+Verde" target="_blank" rel="noopener">在Google地图中打开佛得角 &#8599;</a>' : '地図を読み込めませんでした。<a href="https://www.google.com/maps/search/?api=1&query=Cape+Verde" target="_blank" rel="noopener">Googleマップでカーボベルデを開く &#8599;</a>';
  el.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; height:100%; font-size:14px; color:#5a6c84; padding:20px; text-align:center;">' + msg + "</div>";
};
