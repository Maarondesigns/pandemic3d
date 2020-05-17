import * as Cesium from "../Source/Cesium.js";
import { stringToCesiumColor } from "./convertColors.js";
import {
  isIos,
  isInStandaloneMode,
  detectWindowOrientation,
} from "./detectiPhone.js";

function init(token) {
  let mapProjection = new Cesium.WebMercatorProjection(Cesium.Ellipsoid.WGS84);
  let COVID19,
    covType = "Countries",
    dataSources = {},
    pathNames = {
      Countries: "data/world_110m.geo.json",
      USACounties: "data/USA_counties_20m.json",
      USAStates: "data/USA_states_20m.json",
    },
    heightMultiplier = 3,
    heightMultipliers = {
      Countries: 1000000,
      Countries_States: 1000000,
      USACounties: 100000,
      USAStates: 100000,
    },
    dataKeys,
    selectedDataKey = "casesPerOneMillion",
    viewingDate,
    dateAnimation = false,
    dateAnimationInterval,
    mostRecentData,
    oldestData,
    countryGeometries,
    dateFormat,
    JHDEntities,
    USACountiesEntities,
    USAStatesEntities,
    selectedEntity,
    colorFunction,
    scale = "linear",
    extrudeHeights = true,
    allCases,
    minCases,
    maxCases,
    colorScaleLinear,
    linearScale,
    logScale,
    colorScaleLog,
    sortMethod = { method: "cases", direction: "dsc" },
    legendHidden = false,
    topLegHidden = false,
    totalsHidden = false;

  Cesium.Ion.defaultAccessToken = token;

  let naturalEarth = new Cesium.ProviderViewModel({
    name: "Natural Earth",
    iconUrl: "./img/naturalEarth.png",
    tooltip: "Natural Earth",
    creationFunction: function () {
      return new Cesium.TileMapServiceImageryProvider({
        url: "data/naturalEarthSmall",
      });
    },
  });

  let sentinel2 = new Cesium.ProviderViewModel({
    name: "Sentinel 2",
    iconUrl: "./img/sentinel2.png",
    tooltip: "Sentinel 2",
    creationFunction: function () {
      return new Cesium.IonImageryProvider({ assetId: 3954 });
    },
  });

  let osm = new Cesium.ProviderViewModel({
    name: "Open Street Maps",
    iconUrl: "./img/osm.png",
    tooltip: "Open Street Maps",
    creationFunction: function () {
      return new Cesium.OpenStreetMapImageryProvider({
        url: "https://a.tile.openstreetmap.org/",
      });
    },
  });

  let esriSat = new Cesium.ProviderViewModel({
    name: "Esri Satellite",
    iconUrl: "./img/esri_satellite.png",
    tooltip: "Esri Satellite",
    creationFunction: function () {
      return new Cesium.ArcGisMapServerImageryProvider({
        url:
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
      });
    },
  });
  let esriStreet = new Cesium.ProviderViewModel({
    name: "Esri Street",
    iconUrl: "./img/esri_street.png",
    tooltip: "Esri Street",
    creationFunction: function () {
      return new Cesium.ArcGisMapServerImageryProvider({
        url:
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
      });
    },
  });

  let imageryProviderViewModels = [
    naturalEarth,
    sentinel2,
    osm,
    esriSat,
    esriStreet,
  ];

  let selectedImageryProviderViewModel = esriSat;

  let viewer = new Cesium.Viewer("cesiumContainer", {
    // scene3DOnly: true,
    geocoder: false,
    selectionIndicator: false,
    homeButton: true,
    sceneModePicker: true,
    timeline: false,
    navigationHelpButton: false,
    baseLayerPicker: true,
    imageryProviderViewModels,
    selectedImageryProviderViewModel,
    terrainProviderViewModels: [],
    mapProjection,
    contextOptions: {
      webgl: {
        preserveDrawingBuffer: true,
      },
    },
    orderIndependentTranslucency: false,
    // terrainExaggeration: 40
    // requestRenderMode: true
  });

  let scene = viewer.scene;
  let camera = viewer.camera;
  let imageryLayers = scene.imageryLayers;
  // let {
  //   selectedImagery,
  //   // imageryProviderViewModels,
  // } = viewer.baseLayerPicker.viewModel;
  // selectedImagery = imageryProviderViewModels[1];
  // console.log({ selectedImagery, imageryProviderViewModels });
  let USARect = {
    west: -2.1790256465835025,
    south: 0.4257958999306328,
    east: -1.1673712194582864,
    north: 0.8619196460836018,
  };
  USARect = new Cesium.Rectangle(
    USARect.west,
    USARect.south,
    USARect.east,
    USARect.north
  );
  // viewer.geocoder.viewModel.destinationFound = function (a,b,c) {
  //   console.log(a,b,c);
  // };

  var viewModel = {
    alpha: 0,
    brightness: 0,
    contrast: 0,
    hue: 0,
    saturation: 0,
    gamma: 0,
  };
  // Convert the viewModel members into knockout observables.
  Cesium.knockout.track(viewModel);

  // // Bind the viewModel to the DOM elements of the UI that call for it.
  // var baseLayerAdjustments = document.getElementById(
  //   "baseLayerAdjustments"
  // );
  // Cesium.knockout.applyBindings(viewModel, baseLayerAdjustments);

  // function subscribeLayerParameter(name) {
  //   Cesium.knockout
  //       .getObservable(viewModel, name)
  //       .subscribe(function(newValue) {
  //           // for (let i = 0; i < imageryLayers.length; i++) {
  //           if (imageryLayers.length > 0) {
  //               var layer = imageryLayers.get(0);
  //               layer[name] = newValue;
  //           }
  //       });
  // }
  // subscribeLayerParameter("alpha");
  // subscribeLayerParameter("brightness");
  // subscribeLayerParameter("contrast");
  // subscribeLayerParameter("hue");
  // subscribeLayerParameter("saturation");
  // subscribeLayerParameter("gamma");

  // function createModel(url, height) {
  //   var position = Cesium.Cartesian3.fromDegrees(
  //     -80.289691,
  //     25.693275,
  //     height
  //   );
  //   var heading = Cesium.Math.toRadians(0);
  //   var pitch = 0;
  //   var roll = 0;
  //   var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  //   var orientation = Cesium.Transforms.headingPitchRollQuaternion(
  //     position,
  //     hpr
  //   );

  //   var model = viewer.entities.add({
  //     name: url,
  //     position: position,
  //     orientation: orientation,
  //     model: {
  //       uri: url,
  //       minimumPixelSize : 200,
  //       color: Cesium.Color.ORANGE
  //       // maximumScale: 20000,
  //     },
  //   });
  //   Cesium.when(model.readyPromise)
  //     .then(function () {
  //       viewer.flyTo(model, {offset: new Cesium.HeadingPitchRange(Cesium.Math.toRadians(90), -1, 0)})
  //     })
  //     .otherwise(function (error) {
  //       window.alert(error);
  //     });
  // }

  // createModel("/data/3dmodels/schoolbus.glb", 0.0);

  function updateViewModel() {
    // for (let i = 0; i < imageryLayers.length; i++) {
    if (imageryLayers.length > 0) {
      var layer = imageryLayers.get(0);
      viewModel.alpha = layer.alpha;
      viewModel.brightness = layer.brightness;
      viewModel.contrast = layer.contrast;
      viewModel.hue = layer.hue;
      viewModel.saturation = layer.saturation;
      viewModel.gamma = layer.gamma;
    }
  }
  // imageryLayers.layerAdded.addEventListener(updateViewModel);
  // imageryLayers.layerRemoved.addEventListener(updateViewModel);
  // imageryLayers.layerMoved.addEventListener(updateViewModel);
  updateViewModel();

  function updateImageryFromViewModel() {
    if (imageryLayers.length > 0) {
      var layer = imageryLayers.get(0);
      layer.alpha = viewModel.alpha;
      layer.brightness = viewModel.brightness;
      layer.contrast = viewModel.contrast;
      layer.hue = viewModel.hue;
      layer.saturation = viewModel.saturation;
      layer.gamma = viewModel.gamma;
    }
  }

  Cesium.knockout
    .getObservable(viewer.baseLayerPicker.viewModel, "selectedImagery")
    .subscribe(function (e) {
      if (e.name.includes("Mapbox"))
        viewer.scene.globe.maximumScreenSpaceError = 3.5;
      else viewer.scene.globe.maximumScreenSpaceError = 1.8;
      // updateImageryFromViewModel();
      // if (hasLabels.indexOf(e.name) !== -1) {
      //     that.toggleCountryLabels(false);
      //     if (
      //         !that.state.showingCOVID19 &&
      //         !that.state.showHaveVisited
      //     )
      //         that.toggleCountryBorders(false);
      // } else {
      //     that.toggleCountryLabels(true);
      //     that.toggleCountryBorders(true);
      // }
      if (e.name === "Natural Earth") {
        viewModel.brightness = 0.8;
        viewModel.contrast = 1.55;
        viewModel.saturation = 0.65;
        viewModel.gamma = 0.5;
        updateImageryFromViewModel();
      } //else {
      //     viewModel.brightness = 1;
      //     viewModel.contrast = 1;
      //     viewModel.saturation = 1;
      //     viewModel.gamma = 1;
      //     updateImageryFromViewModel();
      // }
    });

  // viewModel.brightness = 0.8;
  // viewModel.contrast = 1.55;
  // viewModel.saturation = 0.65;
  // viewModel.gamma = 0.5;
  // updateImageryFromViewModel();

  let globeData = {};

  // d3.json("data/world_110m.geo.json").then(function (land) {
  //   // land = processLand(land);
  //   d3.json("data/world_50m.geo.json")
  //     .then(function (land2) {
  //       // land2 = processLand(land2);
  //       land2.features.forEach((f) => {
  //         let {
  //           name,
  //           adm0_a3_us,
  //           adm0_a3_is,
  //           iso_a3,
  //           type,
  //           sovereignt,
  //         } = f.properties;
  //         let e1 = land.features.find(
  //           (x) => x.properties.adm0_a3_us === adm0_a3_us
  //         );
  //         let e2 = land.features.find(
  //           (x) => x.properties.adm0_a3_is === adm0_a3_is
  //         );
  //         let e3 = land.features.find((x) => x.properties.iso_a3 === iso_a3);

  //         // if (e1) console.log("adm0_a3_us: ", e1);
  //         // if (e2) console.log("adm0_a3_is: ", e2);
  //         // if (e3) console.log("iso_a3: ", e3);

  //         if (!e1 && !e2 && !e3) {
  //           land.features.push(f);
  //         }
  //       });
  //       findCentroids(land);
  //       globeData.land = land;
  //       // //these are the geometries in 10m resolution missing from others
  //       // //loading entire highres file is too big: 21Mb
  //       // //missing list will be updated with more geometries saved from bing
  //       // let missing = ["UMI", "TUV", "GIB"];
  //       // return Promise.all(
  //       //     missing.map(x =>
  //       //         fetch(
  //       //             `data/world_10m/${x}.geo.json`
  //       //         ).then(res => {
  //       //             return res.json().then(data => {
  //       //                 return data;
  //       //             });
  //       //         })
  //       //     )
  //       // ).then(data => {
  //       //     data.forEach(f => {
  //       //         land.features.push(f);
  //       //     });
  //       //     that.findCentroids(land);
  //       //     globeData.land = land;
  //       //     // globeData.mediumDef = land2;

  //       // });
  //     })
  //     .then(() => {
  initCOVID19();
  // });
  // });

  function findCentroids(featureCollection) {
    let projection = d3.geoMercator().rotate([0, 0]);
    let path = d3.geoPath().projection(projection);

    var svg = d3
      .select("body")
      .append("svg")
      .style("z-index", "-1")
      .style("background", "white")
      .style("position", "absolute")
      .style("top", "0")
      .style("width", "100%")
      .style("height", "100%");

    //   svg
    //     .selectAll("path")
    //     .data(featureCollection.features)
    //     .enter()
    //     .append("path", path)
    //     .style("stroke", "black");

    svg
      .selectAll("circle")
      .data(featureCollection.features)
      .enter()
      .append("circle")
      .attr("transform", function (d) {
        d.properties.centroid = d3.geoCentroid(d);
        return "translate(" + path.centroid(d) + ")";
      });
    // .attr("r", 10)
    // .style("stroke", "red");
    svg.remove();
  }

  function initCOVID19() {
    // var requestOptions = {
    //   method: "GET",
    //   redirect: "follow",
    // };

    return fetch("countries") //"https://corona.lmao.ninja/countries?sort=country", requestOptions)
      .then((response) => response.json())
      .then((countries) => {
        return fetch("totals") //"https://corona.lmao.ninja/all", requestOptions)
          .then((response) => response.json())
          .then((totals) => {
            return fetch("jhucsse") //"https://corona.lmao.ninja/v2/jhucsse", requestOptions)
              .then((response) => response.json())
              .then((JohnsHopkinsData) => {
                JohnsHopkinsData.forEach((d) => {
                  let name = d.city;
                  if (d.province) {
                    if (name) name += `, ${d.province}`;
                    else name = d.province;
                  }
                  if (d.country) {
                    if (name) name += `, ${d.country}`;
                    else name = d.country;
                  }
                  d.name = name;
                });
                COVID19 = {
                  countries: {},
                  totals,
                  JohnsHopkinsData,
                };
                countries.forEach((d) => {
                  let id = d.countryInfo.iso3;
                  if (id) COVID19.countries[id] = d;
                });
                $("#loading").hide();
                initTotals();
                initUSAData();
                updateMap().then(() => {
                  drawLegend();
                });
                if (isIos() && !isInStandaloneMode()) {
                  setTimeout(() => {
                    showAddToHomeScreen();
                  }, 1000 * 15);
                }
                if (detectWindowOrientation() === "portrait") {
                  setTimeout(() => {
                    toggleLegend();
                    toggleTotals();
                  }, 1500);
                }
              })
              .catch((error) => console.log("error", error));
          })
          .catch((error) => console.log("error", error));
      })
      .catch((error) => console.log("error", error));
  }

  function showAddToHomeScreen() {
    $("body").append(
      `<div id="addToHomeScreen"><img id="homeScreenIcon" src="img/home_screen_icon.jpg"><img id="iosShareIcon" src="img/ios_share.png">Add this to your home screen for better experience.</div>`
    );
    $("#addToHomeScreen").click(function () {
      $(this).remove();
    });
  }

  function initUSAData() {
    COVID19.USACounties = [];
    d3.csv(
      "us/counties/confirmed",
      // "https://usafactsstatic.blob.core.windows.net/public/data/covid-19/covid_confirmed_usafacts.csv",
      function (data) {
        let obj = { confirmed: data };
        COVID19.USACounties.push(obj);
      }
    ).then(() => {
      d3.csv("us/counties/deaths", function (data) {
        let conf = COVID19.USACounties.find(
          (x) => x.confirmed.countyFIPS === data.countyFIPS
        );
        if (conf) {
          conf.deaths = data;
        }
      });
    });
  }

  function toggleTotals() {
    $(".total_details").slideToggle();
    totalsHidden = !totalsHidden;
    $("#toggleTotals > div").css({
      transform: `rotate(${totalsHidden ? 0 : 180}deg)`,
    });
    let vdsc = $("#viewingDateSliderContainer");
    if (vdsc[0]) {
      let interval = setInterval(() => {
        vdsc.css({
          bottom: `${$("#totals").height() + 25}px`,
        });
      }, 15);
      setTimeout(() => {
        clearInterval(interval);
      }, 500);
    }
  }

  function initTotals() {
    let { totals } = COVID19;
    let { updated, cases, active, deaths, recovered, critical } = totals;
    $("#cesiumContainer").append(`<div id="totals"></div>`);
    let t = $("#totals");
    let aP = ((active / cases) * 100).toFixed(2);
    t.append(
      `<div style="font-weight:bold;">Total Cases: ${formatN(
        cases
      )} <span class="subtext">(Updated ${moment(
        updated
      ).fromNow()})</span></div>`
    );

    if (detectWindowOrientation()) {
      t.append(
        `<div id="toggleTotals"><div style="transform:rotate(${
          totalsHidden ? 0 : 180
        }deg);"><i class="fa fa-angle-double-up"></i></div></div>`
      );
      $("#toggleTotals").click(function () {
        toggleTotals();
      });
    }
    t.append(
      `<div class="total_details" ${
        totalsHidden ? 'style="display:none;"' : ""
      }></div>`
    );
    let td = $(".total_details");
    td.append(
      `<div class="active">Active: ${formatN(
        active
      )} <span class="subtext">(${aP}%)</span></div>`
    );
    let rP = ((recovered / cases) * 100).toFixed(2);
    td.append(
      `<div class="recovered">Recovered: ${formatN(
        recovered
      )} <span class="subtext">(${rP}%)</span></div>`
    );
    let dP = ((deaths / cases) * 100).toFixed(2);
    td.append(
      `<div class="deaths">Deaths: ${formatN(
        deaths
      )} <span class="subtext">(${dP}%)</span></div>`
    );
    let cP = ((critical / cases) * 100).toFixed(2);
    td.append(
      `<div class="critical">Critical: ${formatN(
        critical
      )} <span class="subtext">(${cP}%)</span></div>`
    );
    // t.append(`<div class="subtext">Updated ${moment(updated).fromNow()}</div>`);
  }

  // function initMap() {
  //   countryGeometries = new Cesium.CustomDataSource("countryGeometries");
  //   viewer.dataSources.add(countryGeometries);
  //   Cesium.GeoJsonDataSource.load(globeData.land).then(function (dataSource) {
  //     let entities = dataSource.entities.values;
  //     entities.forEach((e, ei) => {
  //       e.polygon.arcType = Cesium.ArcType.GEODESIC;
  //       e.polygon.height = undefined;
  //       e.disableDepthTestDistance = Number.POSITIVE_INFINITY;
  //       // e.name = country.Name;
  //       // e.description = new Cesium.CallbackProperty(
  //       //     function() {
  //       //         return that.countryTooltipText(
  //       //             country.CountryCode
  //       //         );
  //       //     }
  //       // );
  //       let outlineMaterial = Cesium.Color.WHITE.withAlpha(0.5);
  //       e.polygon.outline = false;
  //       e.polyline = new Cesium.PolylineGraphics({
  //         positions: e.polygon.hierarchy._value.positions,
  //         material: outlineMaterial,
  //         width: 1,
  //         eyeOffset: new Cesium.Cartesian3(0, 0, -6000),
  //       });
  //       let color = new Cesium.Color(1, 1, 1).withAlpha(0.4);
  //       e.polygon.material = color;
  //       let { adm0_a3_us, adm0_a3_is, iso_a3 } = e.properties;
  //       let id = iso_a3.getValue();
  //       if (!id) id = adm0_a3_is.getValue();
  //       if (!id) id = adm0_a3_us.getValue();
  //       if (!id) console.log(e.properties);
  //       let count = countryGeometries.entities.values.filter(
  //         (x) => x.id.split("_")[0] === id
  //       ).length;
  //       e["_id"] = `${id}_${count}`;
  //       countryGeometries.entities.add(e);
  //     });
  //     updateMap();
  //   });
  // }

  function drawEntities() {
    let land = globeData[covType];
    let path = pathNames[covType];
    if (land) {
      loadEntities(land);
    } else {
      d3.json(path).then((land) => {
        globeData[covType] = land;
        findCentroids(land);
        loadEntities(land);
      });
    }
  }

  function loadEntities(land) {
    dataSources[covType] = new Cesium.CustomDataSource(covType);
    viewer.dataSources.add(dataSources[covType]);
    Cesium.GeoJsonDataSource.load(land).then(function (dataSource) {
      let entities = dataSource.entities.values;
      entities.forEach((e, ei) => {
        e.polygon.arcType = Cesium.ArcType.GEODESIC;
        e.polygon.height = undefined;
        e.disableDepthTestDistance = Number.POSITIVE_INFINITY;
        e.polygon.outline = false;
        let id = generateID(e);
        let data = getData(id);
        setColor(e, data);
        setDescription(e, data);
        e.data = data;
        let outlineMaterial = Cesium.Color.WHITE.withAlpha(
          data && data[[selectedDataKey]] ? 0.5 : 0.1
        );
        e.polyline = new Cesium.PolylineGraphics({
          positions: e.polygon.hierarchy._value.positions,
          material: outlineMaterial,
          width: 1,
          eyeOffset: new Cesium.Cartesian3(0, 0, -6000),
        });
        let count = dataSources[covType].entities.values.filter(
          (x) => x.id.split("_")[0] == id
        ).length;
        id = `${id}_${count}`;
        e["_id"] = id;
        dataSources[covType].entities.add(e);
      });
    });
  }

  function getData(id) {
    switch (covType) {
      case "Countries":
        return COVID19.countries[id];
      case "USACounties":
        let county = COVID19.USACounties.find(
          (x) => +x.confirmed.countyFIPS === +id
        );
        if (county) {
          let obj = JSON.parse(JSON.stringify(county));
          obj.confirmed = +county.confirmed[viewingDate];
          obj.deaths = +county.deaths[viewingDate];
          return obj;
        }
        break;
      case "USAStates":
        let states = {};
        COVID19.USACounties.forEach((c) => {
          let confirmed = c.confirmed ? +c.confirmed[viewingDate] : 0;
          let deaths = c.deaths ? +c.deaths[viewingDate] : 0;
          let sFIPS = c.confirmed.stateFIPS;
          if (sFIPS.length === 1) sFIPS = `0${sFIPS}`;
          let s = states[sFIPS];
          if (s) {
            states[sFIPS].confirmed += confirmed;
            states[sFIPS].deaths += deaths;
          } else states[sFIPS] = { confirmed, deaths };
        });
        return states[id];
    }
  }

  function generateID(e) {
    switch (covType) {
      case "Countries":
        let { adm0_a3_us, adm0_a3_is, iso_a3 } = e.properties;
        let id = iso_a3.getValue();
        if (!id) id = adm0_a3_is.getValue();
        if (!id) id = adm0_a3_us.getValue();
        if (!id) console.log(e.properties);
        return id;
      case "USACounties":
        let { FIPS } = e.properties;
        FIPS = FIPS.getValue();
        return +FIPS;
      case "USAStates":
        let { STATE } = e.properties;
        STATE = STATE.getValue();
        return STATE;
    }
  }

  function updateMap(dontDrawSlider) {
    return new Promise((res) => {
      Object.keys(dataSources).forEach((k) => {
        let ds = dataSources[k];
        ds.entities.removeAll();
        viewer.dataSources.remove(ds);
        ds = undefined;
      });

      switch (covType) {
        case "Countries":
          dataKeys = Object.keys(
            COVID19.countries[Object.keys(COVID19.countries)[0]]
          ).filter(
            (x) => !/updated|country|countryInfo|population|continent/.test(x)
          );
          if (!selectedDataKey) selectedDataKey = dataKeys[0];
          if (JHDEntities) JHDEntities.entities.removeAll();
          allCases = Object.keys(COVID19.countries).map(
            (k) => COVID19.countries[k][selectedDataKey]
          );
          minCases = Math.min(...allCases);
          maxCases = Math.max(...allCases);
          setScales();
          drawEntities();
          $("#viewingDateSliderContainer").remove();
          break;
        case "Countries_States":
          dataKeys = Object.keys(COVID19.JohnsHopkinsData[0].stats);
          if (!selectedDataKey) selectedDataKey = dataKeys[0];
          $("#viewingDateSliderContainer").remove();
          drawJHD();
          break;
        case "USACounties":
          dataKeys = Object.keys(COVID19.USACounties[0]);
          if (!selectedDataKey) selectedDataKey = dataKeys[0];
          if (JHDEntities) JHDEntities.entities.removeAll();
          if (viewingDate === mostRecentData.format(dateFormat)) {
            allCases = COVID19.USACounties.map((c) =>
              c[selectedDataKey] ? +c[selectedDataKey][viewingDate] : 0
            );
            minCases = Math.min(...allCases);
            maxCases = Math.max(...allCases);
            setScales();
          }
          drawEntities();
          // drawUSACounties();
          if (!dontDrawSlider) drawDateSlider();
          break;
        case "USAStates":
          dataKeys = Object.keys(COVID19.USACounties[0]);
          if (!selectedDataKey) selectedDataKey = dataKeys[0];
          if (JHDEntities) JHDEntities.entities.removeAll();
          if (viewingDate === mostRecentData.format(dateFormat)) {
            let states = {};
            COVID19.USACounties.forEach((c) => {
              let k = c[selectedDataKey];
              if (k) {
                let v = +k[viewingDate];
                let state = c[selectedDataKey].State;
                if (states[state]) states[state] += v;
                else states[state] = v;
              }
            });
            COVID19.USACounties.map((c) =>
              c[selectedDataKey] ? +c[selectedDataKey][viewingDate] : 0
            );
            allCases = Object.keys(states).map((k) => states[k]);
            minCases = Math.min(...allCases);
            maxCases = Math.max(...allCases);
            setScales();
          }
          drawEntities();
          // drawUSAStates();
          if (!dontDrawSlider) drawDateSlider();
          break;
      }
      res();
    });
  }

  function startDateAnimation() {
    function nextDay() {
      let d = moment(viewingDate, dateFormat).add(1, "day");
      if (d.isAfter(mostRecentData)) d = oldestData;
      viewingDate = d.format(dateFormat);
      // updateMap().then(() => {
      //   drawLegend();
      // });
      dateChanged();
      drawLegend();
      drawDateSlider();
    }
    dateAnimationInterval = setInterval(
      () => {
        nextDay();
      },
      2000 //covType === "USAStates" ? 2500 : 6000
    );
    nextDay();
  }

  function stopDateAnimation() {
    clearInterval(dateAnimationInterval);
  }

  function drawDateSlider() {
    let array = [oldestData.format(dateFormat)];
    let current = oldestData.clone();
    while (!current.isAfter(mostRecentData, "day")) {
      array.push(current.format(dateFormat));
      current.add(1, "day");
    }
    $("#viewingDateSliderContainer").remove();
    $("#cesiumContainer").append(
      `<div id="viewingDateSliderContainer" style="bottom:${
        $("#totals").height() + 25
      }px;">
      <div id="date-popper"></div>
      <div id="dateSliderPlay" style="${
        dateAnimation
          ? "padding-left:0px;width:22px"
          : "padding-left:3px;width:19px"
      }" ${dateAnimation ? `class="playing"` : ""}>${
        dateAnimation
          ? `<i class="fa fa-pause"></i>`
          : `<i class="fa fa-play"></i>`
      }</div>
      <input style="width:100%;" type="range" id="viewingDateSlider" name="viewingDateSlider" min="0" max="${
        array.length - 1
      }" value="${array.findIndex((x) => x === viewingDate)}">
      </div>`
    );

    $("#dateSliderPlay").click(function () {
      let el = $(this);
      if (dateAnimation) {
        el.removeClass("playing");
        el.html(`<i class="fa fa-play"></i>`);
        el.css({ paddingLeft: "3px", width: "19px" });
        stopDateAnimation();
      } else {
        el.addClass("playing");
        el.html(`<i class="fa fa-pause"></i>`);
        el.css({ paddingLeft: "0px", width: "22px" });
        startDateAnimation();
      }
      dateAnimation = !dateAnimation;
    });

    let slider = $("#viewingDateSlider");

    let percent = slider.val() / array.length;
    let plus = 9;
    if (window.innerWidth < 1100) plus = 9 - percent * 9;
    let w = slider.width();
    $("#date-popper").css({ left: percent * w + plus + "px" });
    $("#date-popper").html(viewingDate);
    $("#viewingDateSlider").on("input", function (e) {
      $(this).addClass("focused");
      let d = array[this.value];
      let w = $(this).width();
      let percent = this.value / array.length;
      $("#date-popper").stop().fadeIn();
      percent = this.value / array.length;
      plus = 9;
      if (window.innerWidth < 1100) plus = 9 - percent * 9;
      $("#date-popper").css({ left: percent * w + plus + "px" });
      $("#date-popper").html(d);
    });

    $("#viewingDateSlider").on("change", function (e) {
      $(this).removeClass("focused");
      let d = array[this.value];
      viewingDate = d;
      dateChanged();
      drawLegend();
    });
  }

  function dateChanged() {
    let entities = dataSources[covType].entities.values;
    let changed = 0;
    entities.forEach((e, ei) => {
      let data = getData(e.id.split("_")[0]);
      if (data && data[selectedDataKey] !== e.data[selectedDataKey]) {
        changed += 1;
        e.data = data;
        setDescription(e, data);
        setColor(e, data);
      }
    });
  }

  function setDescription(e, covid) {
    if (covid) {
      switch (covType) {
        case "Countries":
          let {
            cases,
            casesPerOneMillion,
            deaths,
            deathsPerOneMillion,
            active,
            activePerOneMillion,
            recovered,
            recoveredPerOneMillion,
            critical,
            criticalPerOneMillion,
            todayCases,
            todayDeaths,
            tests,
            testsPerOneMillion,
          } = covid;
          let mob = Math.min(window.innerWidth, window.innerHeight) < 450;
          function ss(k) {
            if (selectedDataKey === k)
              return `style="font-weight:bold;text-decoration:underline;"`;
            else return "";
          }
          e.description = `
            <div>
                <div style="font-weight:bold;text-decoration:underline;">Total</div>
                <div style="margin-left:10px;">
                    <div>
                      <span ${ss("cases")}>Cases: ${formatN(cases)}</span>
                      <span ${ss("casesPerOneMillion")}> (${formatN(
            casesPerOneMillion
          )} per ${mob ? "M" : "million"})</span>
                    </div>
                    <div>
                      <span ${ss("deaths")}>Deaths: ${formatN(deaths)}</span>
                      <span ${ss("deathsPerOneMillion")}>(${formatN(
            deathsPerOneMillion
          )} per ${mob ? "M" : "million"})</span>
                    </div>
                    <div>
                    <span ${ss("active")}>Active: ${formatN(active)}</span>
                    <span ${ss("activePerOneMillion")}> (${formatN(
            activePerOneMillion
          )} per ${mob ? "M" : "million"})</span>
                    </div>
                    <div>
                    <span ${ss("recovered")}>Recovered: ${formatN(
            recovered
          )}</span>
                    <span ${ss("recoveredPerOneMillion")}> (${formatN(
            recoveredPerOneMillion
          )} per ${mob ? "M" : "million"})</span>
                    </div>
                    <div>
                    <span ${ss("critical")}>Critical: ${formatN(
            critical
          )}</span>
                    <span ${ss("criticalPerOneMillion")}> (${formatN(
            criticalPerOneMillion
          )} per ${mob ? "M" : "million"})</span>
                    </div>
                    <div>
                    <span ${ss("tests")}>Tests: ${formatN(tests)}</span>
                    <span ${ss("testsPerOneMillion")}> (${formatN(
            testsPerOneMillion
          )} per ${mob ? "M" : "million"})</span>
                    </div>
                </div>
            </div>
            <div>
                <div style="font-weight:bold;text-decoration:underline;">Today</div>
                <div style="margin-left:10px;">
                    <div ${ss("todayCases")}>Cases: ${formatN(todayCases)}</div>
                    <div ${ss("todayDeaths")}>Deaths: ${formatN(todayDeaths)}</div>
                </div>
            </div>
            `;
          break;
        case "USACounties":
          e.name = `${covid.confirmed["County Name"]}, ${covid.confirmed.State}`;
          e.description = `<div style="display:block;"><div style="font-weight:bold;">As of ${viewingDate}</div><div>Confirmed: ${formatN(
            covid.confirmed
          )}</div><div>Deaths: ${formatN(covid.deaths)}</div></div>`;
          break;
        case "USAStates":
          e.description = `<div style="display:block;"><div style="font-weight:bold;">As of ${viewingDate}</div><div>Confirmed: ${formatN(
            covid.confirmed
          )}</div><div>Deaths: ${formatN(covid.deaths)}</div></div>`;
          break;
      }
    } else e.description = `<div>No Data</div>`;
  }

  function drawJHD() {
    let redCircle = `
    height:27px;
    width:27px;
    border-radius:50%;
    border:solid 1px rgba(255,0,0,0.8);
    background:rgba(255,0,0,0.4);
    margin-right: 5px;
    color:white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 23px;
    `;
    $("#COVID_leg_details").html("");
    $("#COVID_leg_details").append(`
        <div style="display: flex; align-items: center; justify-content:center;">
        <div style="${redCircle}"><i class="fa fa-arrows-h" aria-hidden="true"></i></div>
        <div># Confirmed</div>
        </div>`);
    if (JHDEntities) {
      JHDEntities.entities.removeAll();
      viewer.dataSources.remove(JHDEntities);
      JHDEntities = undefined;
    }
    if (COVID19.JohnsHopkinsData) {
      JHDEntities = new Cesium.CustomDataSource("JHDEntities");
      viewer.dataSources.add(JHDEntities);
      let screenSize = Math.min(window.innerWidth, window.innerHeight);
      let ratio = screenSize / 3000;
      let noLocation = [];
      COVID19.JohnsHopkinsData.forEach((d, i) => {
        if (!d.coordinates.latitude || !d.coordinates.longitude) {
          if (d.name === "Northern Mariana Islands, US") {
            d.coordinates = { latitude: 15.08635, longitude: 145.686101 };
          } else {
            noLocation.push(d);
            d.coordinates = { latitude: 0, longitude: -noLocation.length };
          }
        }
        let r;
        if (d.name.includes("Recovered")) {
          r = true;
        }
        let v = r ? +d.stats.recovered : +d.stats[selectedDataKey];
        if (!v) v = 1;
        let radius = Math.ceil(Math.sqrt(v * ratio));
        let c = r ? [0, 1, 0] : [1, 0, 0];
        let name = d.name;
        let point, ellipse;
        if (extrudeHeights) {
          let r = radius * 2000;
          if (r < 20000) r = 20000;
          ellipse = {
            semiMinorAxis: r,
            semiMajorAxis: r,
            height: 0,
            extrudedHeight: radius * 2000,
            material: new Cesium.Color(c[0], c[1], c[2]).withAlpha(0.5),
            outline: true,
            outlineColor: new Cesium.Color(c[0], c[1], c[2]).withAlpha(1),
          };
        } else {
          point = new Cesium.PointGraphics({
            pixelSize: radius,
            color: new Cesium.Color(c[0], c[1], c[2]).withAlpha(0.4),
            outlineColor: new Cesium.Color(c[0], c[1], c[2]).withAlpha(0.8),
            outlineWidth: 2,
          });
        }
        JHDEntities.entities.add({
          id: `JHD_${i}`,
          module: "JohnsHopkinsData",
          position: Cesium.Cartesian3.fromDegrees(
            +d.coordinates.longitude,
            +d.coordinates.latitude
          ),
          name,
          description: `<div>
                        <div>Confirmed: ${d.stats.confirmed}</div>
                        <div>Deaths: ${d.stats.deaths}</div>
                        <div>Recovered: ${d.stats.recovered}</div>
                        </div>`,
          point,
          ellipse,
        });
      });
    }
  }

  // function drawUSAStates() {
  //   if (USAStatesEntities) {
  //     USAStatesEntities.entities.removeAll();
  //     viewer.dataSources.remove(USAStatesEntities);
  //     USAStatesEntities = undefined;
  //   }
  //   if (globeData.USAStates) {
  //     loadEntities(globeData.USAStates);
  //   } else {
  //     d3.json("data/USA_states_20m.json").then((land) => {
  //       globeData.USAStates = land;
  //       findCentroids(land);
  //       loadEntities(land);
  //     });
  //   }

  //   function loadEntities(land) {
  //     USAStatesEntities = new Cesium.CustomDataSource("USACountiesEntities");
  //     viewer.dataSources.add(USAStatesEntities);
  //     Cesium.GeoJsonDataSource.load(land).then(function (dataSource) {
  //       let entities = dataSource.entities.values;
  //       entities.forEach((e) => {
  //         e.polygon.arcType = Cesium.ArcType.GEODESIC;
  //         e.polygon.height = undefined;
  //         e.disableDepthTestDistance = Number.POSITIVE_INFINITY;
  //         e.polygon.material = new Cesium.Color(
  //           Math.random(),
  //           Math.random(),
  //           Math.random()
  //         );
  //         let outlineMaterial = Cesium.Color.WHITE.withAlpha(0.3);
  //         e.polygon.outline = false;
  //         e.polyline = new Cesium.PolylineGraphics({
  //           positions: e.polygon.hierarchy._value.positions,
  //           material: outlineMaterial,
  //           width: 1,
  //           eyeOffset: new Cesium.Cartesian3(0, 0, -6000),
  //         });
  //         USAStatesEntities.entities.add(e);
  //       });
  //     });
  //   }
  // }

  // function drawUSACounties() {
  //   if (USACountiesEntities) {
  //     USACountiesEntities.entities.removeAll();
  //     viewer.dataSources.remove(USACountiesEntities);
  //     USACountiesEntities = undefined;
  //   }

  //   if (globeData.USACounties) {
  //     loadEntities(globeData.USACounties);
  //   } else {
  //     d3.json("data/USA_counties_20m.json").then((land) => {
  //       globeData.USACounties = land;
  //       findCentroids(land);
  //       loadEntities(land);
  //     });
  //   }

  //   function loadEntities(land) {
  //     USACountiesEntities = new Cesium.CustomDataSource("USACountiesEntities");
  //     viewer.dataSources.add(USACountiesEntities);
  //     Cesium.GeoJsonDataSource.load(land).then(function (dataSource) {
  //       let entities = dataSource.entities.values;
  //       entities.forEach((e) => {
  //         let { FIPS } = e.properties;
  //         FIPS = FIPS.getValue();
  //         let county = COVID19.USACounties.find(
  //           (x) => +x.confirmed.countyFIPS === +FIPS
  //         );
  //         let conf = county ? +county.confirmed[viewingDate] : 0;
  //         let deaths = county ? +county.deaths[viewingDate] : 0;
  //         if (county && (conf || deaths)) {
  //           // e["_id"] = FIPS;
  //           e.fips = +FIPS;
  //           e.name = `${county.confirmed["County Name"]}, ${county.confirmed.State}`;
  //           e.description = `<div style="display:block;"><div style="font-weight:bold;">As of ${viewingDate}</div><div>Confirmed: ${formatN(
  //             conf
  //           )}</div><div>Deaths: ${formatN(deaths)}</div></div>`;

  //           e.polygon.arcType = Cesium.ArcType.GEODESIC;
  //           e.polygon.height = undefined;
  //           e.disableDepthTestDistance = Number.POSITIVE_INFINITY;
  //           setColor(e, { cases: conf });
  //           // e.polygon.material = new Cesium.Color(0.5, 0.5, 0.5).withAlpha(0.7);
  //           let outlineMaterial = Cesium.Color.WHITE.withAlpha(0.3);
  //           e.polygon.outline = false;
  //           // e.polygon.outlineColor = outlineMaterial;
  //           e.polyline = new Cesium.PolylineGraphics({
  //             positions: e.polygon.hierarchy._value.positions,
  //             material: outlineMaterial,
  //             width: 1,
  //             eyeOffset: new Cesium.Cartesian3(0, 0, -6000),
  //           });
  //           USACountiesEntities.entities.add(e);
  //         }
  //       });
  //     });
  //   }
  // }

  function setColor(e, covid) {
    let c = covid ? covid[selectedDataKey] : 0;
    if (c) {
      let rgb = colorFunction(c);
      let material = stringToCesiumColor(
        rgb,
        extrudeHeights ? 1 : scene.mode === Cesium.SceneMode.SCENE3D ? 0.7 : 0.9
      );
      if (e.polygon) {
        e.polygon.material = material;
        let h = 0;
        if (extrudeHeights) {
          let multi = heightMultipliers[covType] * heightMultiplier;
          h = linearScale(c) * multi;
          if (scale === "log" && logScale) {
            h = logScale(c) * multi;
          }
        }
        e.polygon.extrudedHeight = Math.round(h);
      }
    } else if (e.polygon) {
      e.polygon.material = new Cesium.Color(0.5, 0.5, 0.5).withAlpha(0.4);
      e.polygon.extrudedHeight = 0;
    }
  }

  function setScales() {
    linearScale = d3.scaleSequential().domain([1, maxCases]);

    colorScaleLinear = d3
      .scaleSequential(d3.interpolateReds)
      .domain([1, maxCases]);

    logScale = d3.scaleLog().domain([1, maxCases]);
    colorScaleLog = d3.scaleSequential((d) => d3.interpolateReds(logScale(d)));
    colorFunction = scale === "log" ? colorScaleLog : colorScaleLinear;
  }

  function changeScale(s) {
    scale = s;
    colorFunction = scale === "log" ? colorScaleLog : colorScaleLinear;
    updateMap().then(() => {
      drawLegend();
    });
  }

  function setDateFormat(obj) {
    let remove = ["countyFIPS", "County Name", "State", "stateFIPS"];
    let s = Object.keys(obj).filter((x) => remove.indexOf(x) === -1)[0];
    if (s) {
      s = s.split("/");
      let y = s[2];
      dateFormat = `M/D/${y.length === 2 ? "YY" : "YYYY"}`;
    }
  }

  function formatDataKeyWords(k) {
    let string = k.replace(/([a-z](?=[A-Z]))/g, "$1 ");
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function formatDataKeyShort(k) {
    let string = formatDataKeyWords(k);
    if (string.includes("Million")) string = string.split(" ")[0] + "/M";
    return string;
  }

  function drawLegend() {
    $("#COVID_legend_container").remove();
    $("#selectDataKey").remove();

    $("#cesiumContainer").append(
      `<div id="selectDataKey">
      <select>${dataKeys.map(
        (x) =>
          `<option value=${x} ${
            selectedDataKey === x ? "selected" : ""
          }>${formatDataKeyWords(x)}</option>`
      )}</select>
      </div>`
    );

    $("#selectDataKey > select").on("change", function (e) {
      selectedDataKey = e.target.value;
      updateMap().then(() => drawLegend());
    });

    $("body").append(
      `<div id="COVID_legend_container" class="backdrop" ${
        legendHidden ? `style="transform: translateX(-100%);"` : ""
      }></div>`
    );
    $("#COVID_legend_container").append(`<div id="COVID_legend">
        <div style="
        font-weight:bold;
        background: rgba(255,255,255,0.2); 
        border-bottom: solid 1px rgba(255,255,255,0.4); 
        padding:3px;
        ">Legend</div>`);

    let windowO = detectWindowOrientation();

    if (windowO === "portrait") {
      $("#COVID_legend").append(
        `<div id="legendToggle" class="backdrop"><div style="transform:rotate(${
          legendHidden ? 180 : 0
        }deg);"><i class="fa fa-angle-double-left"></i></div></div>`
      );
      $("#legendToggle").click(toggleLegend);
    }
    $("#COVID_legend").append(`<div class="radios" ${
      topLegHidden ? 'style="display:none;"' : ""
    }>
        <div>
        <input type="radio" id="Countries" name="cov_type" value="Countries" ${
          covType === "Countries" ? "checked" : ""
        }>
        <label for="Countries">Countries colors</label><span class="subtext">[<a target="_blank" href="https://www.worldometers.info/" title="https://www.worldometers.info/">Worldometer</a>]</span>
        </div>
        <div>
        <input type="radio" id="Countries_States" name="cov_type" value="Countries_States" ${
          covType === "Countries_States" ? "checked" : ""
        }>
        <label for="Countries_States">Countries/States circles</label><span class="subtext">[<a target="_blank" href="https://systems.jhu.edu/research/public-health/ncov/" title="https://systems.jhu.edu/research/public-health/ncov/">Johns Hopkins</a>]</span>
        <div style="padding: 6px 45px 4px 25px;"><span style="margin-left:0;" class="subtext">Above resources use the <a target="_blank" href="https://github.com/NovelCOVID/API" title="https://github.com/NovelCOVID/API">NovelCOVID API</a>. You can see a list of COVID related API's <a target="_blank" href="https://covid-19-apis.postman.com/" title="https://covid-19-apis.postman.com/">here</a>.<span class="subtext"></div>
        </div>
        <div class="divider"></div>
        <div>
        <input type="radio" id="USACounties" name="cov_type" value="USACounties" ${
          covType === "USACounties" ? "checked" : ""
        }>
        <label for="USACounties">USA Counties</label>
        <span class="subtext">
        [<a target="_blank" href="https://usafacts.org/visualizations/coronavirus-covid-19-spread-map/" title="https://usafacts.org/visualizations/coronavirus-covid-19-spread-map/">USA Facts</a>]
        </span>
        </div>
        <div>
        <input type="radio" id="USAStates" name="cov_type" value="USAStates" ${
          covType === "USAStates" ? "checked" : ""
        }>
        <label for="USAStates">USA States</label>
        <span class="subtext">
        [Combined Counties]
        </span>
        </div>
        </div>
        <div class="radios" ${topLegHidden ? 'style="display:none;"' : ""}>
        <div>
        <input type="checkbox" id="extrudeHeights" name="extrudeHeights" ${
          extrudeHeights ? "checked" : ""
        }>
        <label for="extrudeHeights">3D</label>
        <input style="display:${
          extrudeHeights ? "" : "none"
        };width: 80%;margin-left: 6px;" type="range" id="heightSlider" name="heightSlider" min="0.1" max="4" step="0.1" value="${heightMultiplier}"/>
        </div>
        </div>
        </div>`);

    $("#COVID_legend").append(
      `<div id="COVID_leg_details" style="padding: 8px 0;${
        topLegHidden ? "display:none;" : ""
      }"></div>`
    );

    $("#extrudeHeights").change(function () {
      extrudeHeights = this.checked;
      updateMap(true).then(() => {
        drawLegend();
      });
    });
    $("#heightSlider").on("change", function () {
      heightMultiplier = this.value;
      updateMap(true);
    });

    $("input[type=radio][name=cov_type]").change(function () {
      covType = this.value;
      selectedDataKey = undefined;
      stopDateAnimation();
      if (covType === "USACounties" || covType === "USAStates") {
        if (scene.mode === Cesium.SceneMode.COLUMBUS_VIEW) {
          let bs = Cesium.BoundingSphere.fromRectangle3D(USARect);
          let { center, radius } = bs;
          let offset = new Cesium.HeadingPitchRange(
            2 * Math.PI,
            -Math.PI / 4,
            radius * 2
          );
          camera.lookAt(center, offset);
          // camera.flyToBoundingSphere(bs, { offset });
        } else {
          camera.flyTo({ destination: USARect });
        }
        if (!viewingDate) {
          mostRecentData = moment();
          setDateFormat(COVID19.USACounties[0].confirmed);
          while (
            !COVID19.USACounties.map(
              (c) => c.confirmed[mostRecentData.format(dateFormat)]
            ).filter((x) => x).length &&
            mostRecentData.isAfter(moment().startOf("year"))
          ) {
            mostRecentData.subtract(1, "day");
          }
          viewingDate = mostRecentData.format(dateFormat);
          oldestData = mostRecentData.clone();
          while (
            COVID19.USACounties.map(
              (c) => c.confirmed[oldestData.format(dateFormat)]
            ).filter((x) => x).length
          ) {
            oldestData.subtract(1, "day");
          }
          oldestData.add(1, "day");
        }
      } else {
        camera.flyHome();
      }
      // if (!JHD && this.value === "Countries_States") JHD = true;
      // else if (JHD && this.value === "Countries") JHD = false;
      updateMap().then(() => {
        drawLegend();
      });
    });
    $("input[type=radio][name=usa_counties]").change(function () {
      USACounties = true;
      updateMap().then(() => {
        drawLegend();
      });
    });

    colorFunction = scale === "log" ? colorScaleLog : colorScaleLinear;

    const barHeight = 20;
    const width = $("#COVID_leg_details").width() * 0.9;
    const points = d3.range(1, maxCases, maxCases / 20);
    const barWidth = width / points.length;
    const height = barHeight;

    $("#COVID_leg_details").html("");

    $("#COVID_leg_details").append(`<div id="COVID_leg_svg"></div>
<button class="${
      scale === "log" ? "confirmButton" : "noButton"
    }" id="covid_logarithmic">Logarithmic</button>
<button class="${
      scale === "linear" ? "confirmButton" : "noButton"
    }" id="covid_linear">Linear</button>
</div>`);
    $("#covid_logarithmic").click(function () {
      if (scale !== "log") {
        scale = "log";
        updateMap().then(() => {
          drawLegend();
        });
      }
    });
    $("#covid_linear").click(function () {
      if (scale !== "linear") {
        scale = "linear";
        updateMap().then(() => {
          drawLegend();
        });
      }
    });

    $("#COVID_legend").append(
      `<div id="legBarTooltip"><div class="lbt_text"></div><div class="after"></div></div>`
    );

    const svg = d3
      .select("#COVID_legend #COVID_leg_svg")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    svg
      .append("g")
      .selectAll("bars")
      .data(points)
      .enter()
      .append("rect")
      .attr("class", "leg-bar")
      .attr("y", 0)
      .attr("x", (d, i) => i * barWidth)
      .attr("width", barWidth)
      .attr("height", barHeight)
      .attr("fill", colorFunction)
      .on("mouseout", function (d) {
        $("#legBarTooltip").hide();
      })
      .on("touchend", function (d) {
        $("#legBarTooltip").hide();
      })
      .on("mouseover", function (d, i) {
        showTooltip(d, i, d3.event.pageX);
      })
      .on("mousemove", function (d, i) {
        showTooltip(d, i, d3.event.pageX);
      })
      .on("touchstart", function (d, i) {
        showTooltip(d, i, d3.event.touches[0].pageX);
      })
      .on("touchmove", function (d, i) {
        let left = d3.event.touches[0].pageX;
        let bars = $(".leg-bar");
        let index = bars.toArray().findIndex(function (x) {
          let l = $(x).position().left;
          let r = l + $(x).width();
          return left > l && left < r;
        });
        showTooltip(points[index], index, d3.event.touches[0].pageX);
      });

    function showTooltip(d, i, left) {
      if (d) {
        $("#legBarTooltip").show();
        let n = points[i + 1];
        let t = formatN(d.toFixed());
        if (n) t += ` - ${formatN(n.toFixed())}`;
        else t = `> ${t}`;
        $("#legBarTooltip .lbt_text").html(t);
        let w = $("#legBarTooltip").width();
        let afterLeft = w / 2;
        if (left - w / 2 < 5) {
          afterLeft = left;
          left = w / 2 + 5;
        }
        $("#legBarTooltip").css({ left });
        $("#legBarTooltip .after").css({ left: afterLeft });
      }
    }

    svg
      .append("g")
      .selectAll("bars")
      .data(points)
      .enter()
      .append("rect")
      .attr("y", 0)
      .attr("x", (d, i) => i * barWidth - 0.5)
      .attr("width", 1)
      .attr("height", barHeight)
      .attr("fill", "rgba(255,255,255,0.4)");

    // if (windowO) {
    $("#COVID_legend_container").append(
      `<div id="toggleTopLeg"><div style="transform:rotate(${
        topLegHidden ? 180 : 0
      }deg);"><i class="fa fa-angle-double-up"></i></div></div>`
    );
    $("#toggleTopLeg").click(function () {
      $(".radios").slideToggle();
      $("#COVID_leg_details").slideToggle();
      topLegHidden = !topLegHidden;
      $("#toggleTopLeg > div").css({
        transform: `rotate(${topLegHidden ? 180 : 0}deg)`,
      });
    });
    // }
    $("#COVID_legend_container").append(
      `<div ${
        windowO ? 'style="margin-right:0px;"' : ""
      } class="list list-header"></div><div class="list list-body"></div>`
    );
    let arrow = sortMethod.direction === "dsc" ? "↓" : "↑";
    let formatSDK = formatDataKeyShort(selectedDataKey);
    $(`.list-header`).append(`
  <div style="background:rgba(255,255,255,0.2); border-bottom:solid 1px; font-weight:bold;">
  <div></div>
  <div id="sortAlpha">${covType} ${
      sortMethod.method === "alpha" ? arrow : ""
    }</div>
  <div ${
    formatSDK.length > 10 ? 'style="font-size: 14px; font-weight:regular;"' : ""
  } id="sortCases">${formatSDK} ${
      sortMethod.method === "cases" ? arrow : ""
    }</div>
  </div>
  `);
    $("#sortAlpha").click(function () {
      let direction = "asc";
      if (sortMethod.method === "alpha") {
        if (sortMethod.direction === "dsc") direction = "asc";
        else direction = "dsc";
      }
      sortMethod = { method: "alpha", direction };
      drawLegend();
    });
    $("#sortCases").click(function () {
      let direction = "asc";
      if (sortMethod.method === "cases") {
        if (sortMethod.direction === "dsc") direction = "asc";
        else direction = "dsc";
      }
      sortMethod = { method: "cases", direction };
      drawLegend();
    });
    let list = [];

    switch (covType) {
      case "Countries":
        list = Object.keys(COVID19.countries).map((k) => {
          return {
            id: k,
            name: COVID19.countries[k].country,
            value: COVID19.countries[k][selectedDataKey],
          };
        });
        break;
      case "Countries_States":
        list = COVID19.JohnsHopkinsData.map((x, i) => {
          return {
            id: `JHD_${i}`,
            name: x.name,
            value: x.stats[selectedDataKey],
          };
        });
        break;
      case "USACounties":
        list = COVID19.USACounties.filter((x) => x[selectedDataKey]).map(
          (x) => {
            let conf = x[selectedDataKey];
            return {
              id: conf.countyFIPS,
              name: `${conf["County Name"]}, ${conf.State}`,
              value: conf[viewingDate],
            };
          }
        );
        break;
      case "USAStates":
        list = [];
        COVID19.USACounties.forEach((c) => {
          let k = c[selectedDataKey];
          if (k) {
            let cases = +k[viewingDate];
            // let deaths = c.deaths ? +c.deaths[viewingDate] : 0;
            let sFIPS = c[selectedDataKey].stateFIPS;
            if (sFIPS.length === 1) sFIPS = `0${sFIPS}`;
            let s = list.find((x) => x.id === sFIPS);
            if (s) {
              s.value += cases;
            } else
              list.push({
                id: sFIPS,
                name: c[selectedDataKey].State,
                value: cases,
              });
          }
        });
        break;
    }
    // let list = JHD
    //   ? COVID19.JohnsHopkinsData.map((x, i) => {
    //       return { id: `JHD_${i}`, name: x.name, value: x.stats.confirmed };
    //     })
    //   : Object.keys(COVID19.countries).map((k) => {
    //       return {
    //         id: k,
    //         name: COVID19.countries[k].country,
    //         value: COVID19.countries[k].cases,
    //       };
    //     });
    list.sort((a, b) => {
      let { method, direction } = sortMethod;
      if (method === "alpha") {
        return direction === "asc"
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      } else {
        return direction === "asc" ? a.value - b.value : b.value - a.value;
      }
    });
    list.forEach((x, i) => {
      $(`.list-body`).append(
        `<div id=${x.id}><div>${i + 1}</div><div>${x.name}</div><div>${formatN(
          x.value
        )}</div></div>`
      );
      $(`.list-body > #${x.id}`).click(function () {
        let e,
          ds = dataSources[covType];
        if (!ds) return;
        if (covType === "Countries_States") {
          e = ds.entities.values.find((e) => e.id === x.id);
        } else {
          e = ds.entities.values.filter((e) => {
            return e.id.split("_")[0] === x.id;
          });
        }
        if (e[0]) selectEntity(e);
      });
      $(`.list-body > #${x.id}`).on("mouseover", function () {
        let e,
          ds = dataSources[covType];
        if (!ds) return;
        if (covType === "Countries_States") {
          e = ds.entities.values.find((e) => e.id === x.id);
        } else {
          e = ds.entities.values.filter((e) => {
            return e.id.split("_")[0] === x.id;
          });
        }
        if (e[0]) hoverEntity(e);
      });

      $(`.list-body > #${x.id}`).on("mouseout", function () {
        if (!selectedEntity) $("#customInfoBox").hide();
      });
    });
  }

  function formatN(num) {
    if (!num && num !== 0) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function updateElementPosition(position, selector) {
    let sp = getScreenPosition(position);
    if (sp && sp.y && sp.x) {
      let cW = $("#cesiumContainer").width(),
        wW = window.innerWidth;
      if (cW < wW) sp.x += wW - cW;
      $(selector).css({
        top: sp.y - 15 + "px",
        left: sp.x + "px",
      });
    }
  }

  function getScreenPosition(position) {
    return Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, position);
  }

  scene.preRender.addEventListener(function () {
    if (selectedEntity) {
      let { position } = selectedEntity;
      if (position) position = position.getValue(new Cesium.JulianDate());
      else {
        let { centroid } = selectedEntity.properties;
        if (centroid) {
          centroid = centroid.getValue();
          position = new Cesium.Cartesian3.fromDegrees(
            centroid[0],
            centroid[1]
          );
        }
      }
      updateElementPosition(position, "#customInfoBox");
    }
  });
  let screenSpaceHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  screenSpaceHandler.setInputAction(function (clicked) {
    viewer.selectedEntity = undefined;
    viewer.trackedEntity = undefined;
    let p = clicked.position;
    var e = scene.pick(p);
    // let entities = scene.drillPick(p);
    // if (entities.length > 1) {
    //     entities = entities.filter(e => e.id.module !== "haveVisited");
    //     if (entities.length) e = entities[0];
    // }
    if (e && e.id) {
      selectEntity(e.id);
    } else {
      $("#customInfoBox").hide();
      selectedEntity = undefined;
      // setNorthUp(1);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  screenSpaceHandler.setInputAction(function (m) {
    if (selectedEntity) return;
    viewer.selectedEntity = undefined;
    viewer.trackedEntity = undefined;
    let p = m.endPosition;
    var e = scene.pick(p);
    // let entities = scene.drillPick(p);
    // if (entities.length > 1) {
    //     entities = entities.filter(e => e.id.module !== "haveVisited");
    //     if (entities.length) e = entities[0];
    // }
    if (e && e.id && !detectWindowOrientation()) {
      hoverEntity(e.id);
    } else {
      $("#customInfoBox").hide();
      selectedEntity = undefined;
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  function hoverEntity(e) {
    if (!e) return;
    if (e.length) {
      e = e[0];
    }
    selectedEntity = undefined;
    let { name, description, position, properties } = e;
    let iB = $("#customInfoBox");
    iB.show();
    let html = `<div class='infoBoxTitle'>${name}</div>`;
    if (description)
      html += `<div class='infoBoxDescription'>${description.getValue()}</div>`;
    iB.html(html);

    if (position) {
      position = position.getValue(new Cesium.JulianDate());
    } else {
      let { centroid } = properties;
      if (centroid) {
        centroid = centroid.getValue();
        position = new Cesium.Cartesian3.fromDegrees(
          centroid[0],
          centroid[1],
          e.polygon.extrudedHeight.getValue()
        );
      }
    }
    updateElementPosition(position, "#customInfoBox");
  }

  function selectEntity(e) {
    if (!e) return;
    let flyTo = e;
    if (e.length) {
      e = e[0];
    }
    selectedEntity = e;
    let { name, description } = e;
    let iB = $("#customInfoBox");
    iB.show();
    let html = `<div class='infoBoxTitle'>${name}</div>`;
    if (description)
      html += `<div class='infoBoxDescription'>${description.getValue()}</div>`;
    iB.html(html);
    //   if (scene.mode === Cesium.SceneMode.COLUMBUS_VIEW) {
    //     let pointsArray = flyTo.length
    //       ? flyTo
    //           .map((c) => c.polygon.hierarchy._value.positions)
    //           .reduce((a, b) => [...a, ...b], [])
    //       : flyTo.polygon.hierarchy._value.positions;
    //     rect = Cesium.Rectangle.fromCartesianArray(pointsArray);
    //     let orientation = new Cesium.HeadingPitchRange(
    //       2 * Math.PI,
    //       -Math.PI / 3,
    //       camera.positionCartographic.height
    //     );
    //     camera.flyTo({
    //       destination: new Cesium.Cartesian3.fromDegrees(
    //         e.properties.centroid.getValue()[0],
    //         e.properties.centroid.getValue()[1]
    //       ),
    //       orientation,
    //       duration: 1,
    //     });
    //   } else {
    let offset = new Cesium.HeadingPitchRange(
      camera.heading,
      camera.pitch,
      covType === "USACounties" ? 500000 : camera.positionCartographic.height
    );
    viewer.flyTo(flyTo, { offset, duration: 2 });
    //   }
  }

  function setNorthUp(duration) {
    viewer.trackedEntity = undefined;
    let pos = camera.position;
    let canvas = scene.canvas,
      w = canvas.clientWidth,
      h = canvas.clientHeight;
    let center = new Cesium.Cartesian2(w / 2, h / 2);
    center = camera.pickEllipsoid(center, scene.globe.ellipsoid);
    if (center) {
      var cartographic = Cesium.Cartographic.fromCartesian(center);
      let lat = Cesium.Math.toDegrees(cartographic.latitude);
      let lon = Cesium.Math.toDegrees(cartographic.longitude);
      let ht = camera.positionCartographic.height;
      center = new Cesium.Cartesian3.fromDegrees(lon, lat, ht);
    }
    //keeping camera.pitch would be nice but this requires getting the distance from
    //the center of the screen and rotating so afterwards the 'center' is still the same distance
    //from the camera and still in the 'center'
    camera.flyTo({
      destination: center ? center : pos,
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-90), //camera.pitch,
        roll: 0.0,
      },
      duration,
    });
  }

  function toggleLegend() {
    let leg = $("#COVID_legend_container");
    if (legendHidden) {
      leg.removeClass("slideLeft");
      leg.addClass("slideRight");
      $("#legendToggle > div").css({ transform: `rotate(0deg)` }); //.animate({ transform: `rotate(0deg)` });
      legendHidden = false;
    } else {
      $("#legendToggle > div").css({ transform: `rotate(180deg)` }); //.animate({ transform: `rotate(180deg)` });
      leg.addClass("slideLeft");
      leg.removeClass("slideRight");
      legendHidden = true;
    }
  }

  window.addEventListener("orientationchange", function () {
    if (Math.abs(window.orientation) === 90 && legendHidden) {
      toggleLegend();
    }
    setTimeout(() => {
      drawLegend();
    }, 200);
  });
}

fetch("cesiumtoken").then((res) => {
  res.text().then((token) => {
    init(token);
  });
});
