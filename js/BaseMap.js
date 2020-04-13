import * as Cesium from "../Source/Cesium.js";
import { stringToCesiumColor } from "./convertColors.js";

function init(token) {
  let mapProjection = new Cesium.WebMercatorProjection(Cesium.Ellipsoid.WGS84);
  let COVID19,
    covType = "Countries",
    viewingDate,
    mostRecentCountyData,
    oldestCountyData,
    countryGeometries,
    dateFormat,
    JHDEntities,
    USACountiesEntities,
    selectedEntity,
    colorFunction,
    scale = "log",
    extrudeHeights = false,
    allCases,
    minCases,
    maxCases,
    colorScaleLinear,
    logScale,
    colorScaleLog,
    sortMethod = { method: "cases", direction: "dsc" },
    legendHidden;

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

  let selectedImageryProviderViewModel = naturalEarth;

  let viewer = new Cesium.Viewer("cesiumContainer", {
    // scene3DOnly: true,
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

  viewModel.brightness = 0.8;
  viewModel.contrast = 1.55;
  viewModel.saturation = 0.65;
  viewModel.gamma = 0.5;
  updateImageryFromViewModel();

  let globeData = {};

  d3.json("data/world_110m.geo.json").then(function (land) {
    // land = processLand(land);
    d3.json("data/world_50m.geo.json")
      .then(function (land2) {
        // land2 = processLand(land2);
        land2.features.forEach((f) => {
          let {
            name,
            adm0_a3_us,
            adm0_a3_is,
            iso_a3,
            type,
            sovereignt,
          } = f.properties;
          let e1 = land.features.find(
            (x) => x.properties.adm0_a3_us === adm0_a3_us
          );
          let e2 = land.features.find(
            (x) => x.properties.adm0_a3_is === adm0_a3_is
          );
          let e3 = land.features.find((x) => x.properties.iso_a3 === iso_a3);

          // if (e1) console.log("adm0_a3_us: ", e1);
          // if (e2) console.log("adm0_a3_is: ", e2);
          // if (e3) console.log("iso_a3: ", e3);

          if (!e1 && !e2 && !e3) {
            land.features.push(f);
          }
        });
        findCentroids(land);
        globeData.land = land;
        // //these are the geometries in 10m resolution missing from others
        // //loading entire highres file is too big: 21Mb
        // //missing list will be updated with more geometries saved from bing
        // let missing = ["UMI", "TUV", "GIB"];
        // return Promise.all(
        //     missing.map(x =>
        //         fetch(
        //             `data/world_10m/${x}.geo.json`
        //         ).then(res => {
        //             return res.json().then(data => {
        //                 return data;
        //             });
        //         })
        //     )
        // ).then(data => {
        //     data.forEach(f => {
        //         land.features.push(f);
        //     });
        //     that.findCentroids(land);
        //     globeData.land = land;
        //     // globeData.mediumDef = land2;

        // });
      })
      .then(() => {
        initCOVID19();
      });
  });

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
                console.log({ COVID19, countries });
                // allCases = Object.keys(COVID19.countries).map(
                //   (k) => COVID19.countries[k].cases
                // );
                // minCases = Math.min(...allCases);
                // maxCases = Math.max(...allCases);
                // setScales();
                initTotals();
                initMap();
                initUSAData();
                drawLegend();
                if (window.innerWidth < 450) {
                  setTimeout(() => {
                    toggleLegend();
                  }, 1000);
                }
              })
              .catch((error) => console.log("error", error));
          })
          .catch((error) => console.log("error", error));
      })
      .catch((error) => console.log("error", error));
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
    t.append(`<div class="total_details"></div>`);
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

  function initMap() {
    countryGeometries = new Cesium.CustomDataSource("countryGeometries");
    viewer.dataSources.add(countryGeometries);
    Cesium.GeoJsonDataSource.load(globeData.land).then(function (dataSource) {
      let entities = dataSource.entities.values;
      entities.forEach((e, ei) => {
        e.polygon.arcType = Cesium.ArcType.GEODESIC;
        e.polygon.height = undefined;
        e.disableDepthTestDistance = Number.POSITIVE_INFINITY;
        // e.name = country.Name;
        // e.description = new Cesium.CallbackProperty(
        //     function() {
        //         return that.countryTooltipText(
        //             country.CountryCode
        //         );
        //     }
        // );
        let outlineMaterial = Cesium.Color.WHITE.withAlpha(0.5);
        e.polygon.outline = false;
        e.polyline = new Cesium.PolylineGraphics({
          positions: e.polygon.hierarchy._value.positions,
          material: outlineMaterial,
          width: 1,
          eyeOffset: new Cesium.Cartesian3(0, 0, -6000),
        });
        let color = new Cesium.Color(1, 1, 1).withAlpha(0.4);
        e.polygon.material = color;
        let { adm0_a3_us, adm0_a3_is, iso_a3 } = e.properties;
        let id = iso_a3.getValue();
        if (!id) id = adm0_a3_is.getValue();
        if (!id) id = adm0_a3_us.getValue();
        if (!id) console.log(e.properties);
        let count = countryGeometries.entities.values.filter(
          (x) => x.id.split("_")[0] === id
        ).length;
        e["_id"] = `${id}_${count}`;
        countryGeometries.entities.add(e);
      });
      updateMap();
    });
  }

  function updateMap() {
    switch (covType) {
      case "Countries":
        allCases = Object.keys(COVID19.countries).map(
          (k) => COVID19.countries[k].cases
        );
        minCases = Math.min(...allCases);
        maxCases = Math.max(...allCases);
        setScales();
        if (JHDEntities) JHDEntities.show = false;
        if (USACountiesEntities) USACountiesEntities.show = false;
        countryGeometries.show = true;
        let entities = countryGeometries.entities.values;
        entities.forEach((e, ei) => {
          let { name, adm0_a3_us, adm0_a3_is, iso_a3 } = e.properties;
          adm0_a3_us = adm0_a3_us.getValue();
          adm0_a3_is = adm0_a3_is.getValue();
          iso_a3 = iso_a3.getValue();
          let cs1 = COVID19.countries[iso_a3];
          let cs2 = COVID19.countries[adm0_a3_is];
          let cs3 = COVID19.countries[adm0_a3_us];
          // console.log({ name, cs1, cs2, cs3 });
          if (cs1) {
            setColor(e, cs1);
            setDescription(e, cs1);
          } else if (cs2) {
            setColor(e, cs2);
            setDescription(e, cs2);
          } else if (cs3) {
            setColor(e, cs3);
            setDescription(e, cs3);
          } else {
            //   console.log({ name, properties });
            setDescription(e, undefined);
          }
        });
        $("#viewingDateSliderContainer").remove();
        break;
      case "Countries_States":
        countryGeometries.show = false;
        if (USACountiesEntities) USACountiesEntities.show = false;
        $("#viewingDateSliderContainer").remove();
        drawJHD();
        break;
      case "USACounties":
        if (viewingDate === mostRecentCountyData.format(dateFormat)) {
          allCases = COVID19.USACounties.map((c) => +c.confirmed[viewingDate]);
          minCases = Math.min(...allCases);
          maxCases = Math.max(...allCases);
          setScales();
        }
        countryGeometries.show = false;
        if (JHDEntities) JHDEntities.show = false;
        drawUSACounties();
        let slider = $("#viewingDateSliderContainer");
        if (!slider[0]) drawUSACountySlider();
        break;
    }
  }

  function drawUSACountySlider() {
    let array = [oldestCountyData.format(dateFormat)];
    let current = oldestCountyData.clone();
    while (!current.isAfter(mostRecentCountyData, "day")) {
      array.push(current.format(dateFormat));
      current.add(1, "day");
    }
    // $("#viewingDateSliderContainer").remove();
    $("#cesiumContainer").append(
      `<div id="viewingDateSliderContainer"><div id="date-popper"></div><input style="width:100%;" type="range" id="viewingDateSlider" name="viewingDateSlider" min="0" max="${
        array.length - 1
      }" value="${array.findIndex((x) => x === viewingDate)}"></div>`
    );

    // $("#viewingDateSliderContainer").on("blur", function (e) {
    //   $("#viewingDateSlider").removeClass("focused");
    // });
    let slider = $("#viewingDateSlider");
    // $("#viewingDateSliderContainer").on("focus", function (e) {
    //   slider.addClass("focused");
    // });
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
      drawLegend();
      updateMap();
    });
  }

  function setDescription(e, covid) {
    if (covid) {
      let {
        cases,
        deaths,
        active,
        recovered,
        critical,
        todayCases,
        todayDeaths,
        casesPerOneMillion,
        deathsPerOneMillion,
        tests,
        testsPerOneMillion,
      } = covid;
      let mob = Math.min(window.innerWidth, window.innerHeight) < 450;
      e.description = `
        <div>
            <div style="font-weight:bold;text-decoration:underline;">Total</div>
            <div style="margin-left:10px;">
                <div>Cases: ${formatN(cases)} (${formatN(
        casesPerOneMillion
      )} per ${mob ? "M" : "million"})</div>
                <div>Deaths: ${formatN(deaths)} (${formatN(
        deathsPerOneMillion
      )} per ${mob ? "M" : "million"})</div>
                <div>Active: ${formatN(active)}</div>
                <div>Recovered: ${formatN(recovered)}</div>
                <div>Critical: ${formatN(critical)}</div>
                <div>Tests: ${formatN(tests)} (${formatN(
        testsPerOneMillion
      )} per ${mob ? "M" : "million"})</div>
            </div>
        </div>
        <div>
            <div style="font-weight:bold;text-decoration:underline;">Today</div>
            <div style="margin-left:10px;">
                <div>Cases: ${formatN(todayCases)}</div>
                <div>Deaths: ${formatN(todayDeaths)}</div>
            </div>
        </div>
        `;
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
        let v = r ? +d.stats.recovered : +d.stats.confirmed;
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
          description: `
                        <div>Confirmed: ${d.stats.confirmed}</div>
                        <div>Deaths: ${d.stats.deaths}</div>
                        <div>Recovered: ${d.stats.recovered}</div>`,
          point,
          ellipse,
        });
      });
    }
  }

  function drawUSACounties() {
    if (USACountiesEntities) {
      USACountiesEntities.entities.removeAll();
      viewer.dataSources.remove(USACountiesEntities);
      USACountiesEntities = undefined;
    }

    if (globeData.USACounties) {
      loadEntities(globeData.USACounties);
    } else {
      d3.json("data/gz_2010_us_050_00_20m.json").then((land) => {
        globeData.USACounties = land;
        findCentroids(land);
        loadEntities(land);
      });
    }

    function loadEntities(land) {
      USACountiesEntities = new Cesium.CustomDataSource("USACountiesEntities");
      viewer.dataSources.add(USACountiesEntities);
      Cesium.GeoJsonDataSource.load(land).then(function (dataSource) {
        let entities = dataSource.entities.values;
        entities.forEach((e) => {
          let { FIPS } = e.properties;
          FIPS = FIPS.getValue();
          let county = COVID19.USACounties.find(
            (x) => +x.confirmed.countyFIPS === +FIPS
          );
          let conf = county ? +county.confirmed[viewingDate] : 0;
          let deaths = county ? +county.deaths[viewingDate] : 0;
          if (county && (conf || deaths)) {
            // e["_id"] = FIPS;
            e.fips = +FIPS;
            e.name = `${county.confirmed["County Name"]}, ${county.confirmed.State}`;
            e.description = `<div><div><strong>As of ${viewingDate}</strong></div><div>Confirmed: ${formatN(
              conf
            )}</div><div>Deaths: ${formatN(deaths)}</div></div>`;

            e.polygon.arcType = Cesium.ArcType.GEODESIC;
            e.polygon.height = undefined;
            e.disableDepthTestDistance = Number.POSITIVE_INFINITY;
            setColor(e, { cases: conf });
            // e.polygon.material = new Cesium.Color(0.5, 0.5, 0.5).withAlpha(0.7);
            let outlineMaterial = Cesium.Color.WHITE.withAlpha(0.3);
            e.polygon.outline = false;
            // e.polygon.outlineColor = outlineMaterial;
            e.polyline = new Cesium.PolylineGraphics({
              positions: e.polygon.hierarchy._value.positions,
              material: outlineMaterial,
              width: 1,
              eyeOffset: new Cesium.Cartesian3(0, 0, -6000),
            });
            USACountiesEntities.entities.add(e);
          }
        });
      });
    }
  }

  function setColor(e, covid) {
    let c = covid ? covid.cases : 0;
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
          h = c * 5;
          if (scale === "log" && logScale) {
            let multi = covType === "USACounties" ? 100000 : 1000000;
            h = logScale(c) * multi;
          }
        }
        e.polygon.extrudedHeight = Math.round(h);
      }
    } else if (e.polygon) {
      e.polygon.material = new Cesium.Color(0.5, 0.5, 0.5).withAlpha(0.7);
    }
  }

  function setScales() {
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
    drawLegend();
    updateMap();
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

  function drawLegend() {
    $("#COVID_legend_container").remove();
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

    if (window.innerWidth < 450 || window.innerHeight < 450) {
      $("#COVID_legend").append(
        `<div id="legendToggle" class="backdrop"></div>`
      );
      $("#legendToggle").click(toggleLegend);
    }
    $("#COVID_legend").append(`<div class="radios">
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
        <div style="padding: 6px 45px 4px 25px;"><span style="margin-left:0;" class="subtext">This site uses the <a target="_blank" href="https://github.com/NovelCOVID/API" title="https://github.com/NovelCOVID/API">NovelCOVID API</a>. You can see a list of COVID related API's <a target="_blank" href="https://covid-19-apis.postman.com/" title="https://covid-19-apis.postman.com/">here</a>.<span class="subtext"></div>
        </div>
        <div>
        <input type="radio" id="USACounties" name="cov_type" value="USACounties" ${
          covType === "USACounties" ? "checked" : ""
        }>
        <label for="USACounties">USA Counties</label><span class="subtext">[<a target="_blank" href="https://usafacts.org/visualizations/coronavirus-covid-19-spread-map/" title="https://usafacts.org/visualizations/coronavirus-covid-19-spread-map/">USA Facts</a>]</span>
        </div>
        </div>
        <div class="radios">
        <div>
        <input type="checkbox" id="extrudeHeights" name="extrudeHeights" ${
          extrudeHeights ? "checked" : ""
        }>
        <label for="extrudeHeights">3D</label>
        </div>
        </div>
        </div>`);

    $("#COVID_legend").append(
      `<div id="COVID_leg_details" style="padding: 8px 0;"></div>`
    );

    $("#extrudeHeights").change(function () {
      extrudeHeights = this.checked;
      updateMap();
    });

    $("input[type=radio][name=cov_type]").change(function () {
      covType = this.value;
      if (covType === "USACounties") {
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
          mostRecentCountyData = moment();
          setDateFormat(COVID19.USACounties[0].confirmed);
          while (
            !COVID19.USACounties.map(
              (c) => c.confirmed[mostRecentCountyData.format(dateFormat)]
            ).filter((x) => x).length &&
            mostRecentCountyData.isAfter(moment().startOf("year"))
          ) {
            mostRecentCountyData.subtract(1, "day");
          }
          viewingDate = mostRecentCountyData.format(dateFormat);
          oldestCountyData = mostRecentCountyData.clone();
          while (
            COVID19.USACounties.map(
              (c) => c.confirmed[oldestCountyData.format(dateFormat)]
            ).filter((x) => x).length
          ) {
            oldestCountyData.subtract(1, "day");
          }
          oldestCountyData.add(1, "day");
        }
      } else {
        camera.flyHome();
      }
      // if (!JHD && this.value === "Countries_States") JHD = true;
      // else if (JHD && this.value === "Countries") JHD = false;
      drawLegend();
      updateMap();
    });
    $("input[type=radio][name=usa_counties]").change(function () {
      USACounties = true;
      drawLegend();
      updateMap();
    });

    colorFunction = scale === "log" ? colorScaleLog : colorScaleLinear;

    const barHeight = 20;
    const width = $("#COVID_leg_details").width() * 0.9;
    const points = d3.range(minCases, maxCases, maxCases / 100);
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
        drawLegend();
        updateMap();
      }
    });
    $("#covid_linear").click(function () {
      if (scale !== "linear") {
        scale = "linear";
        drawLegend();
        updateMap();
      }
    });

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
      .attr("y", 0)
      .attr("x", (d, i) => i * barWidth)
      .attr("width", barWidth)
      .attr("height", barHeight)
      .attr("fill", colorFunction);

    svg
      .append("text")
      .text(function () {
        return formatN(maxCases);
      })
      .style("font-size", "14px")
      .attr("fill", "white")
      .style("text-align", "right")
      .attr("y", height - 5)
      .attr("x", width - 55);

    $("#COVID_legend_container").append(`<div class="list"></div>`);
    let arrow = sortMethod.direction === "dsc" ? "↓" : "↑";
    $(`.list`).append(`
  <div style="background:rgba(255,255,255,0.2); border-bottom:solid 1px; font-weight:bold;"><div id="sortAlpha">${
    covType
    // JHD ? "Countries/States" : "Countries"
  } ${sortMethod.method === "alpha" ? arrow : ""}</div>
  <div id="sortCases">Cases ${
    sortMethod.method === "cases" ? arrow : ""
  }</div></div>
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
            value: COVID19.countries[k].cases,
          };
        });
        break;
      case "Countries_States":
        list = COVID19.JohnsHopkinsData.map((x, i) => {
          return { id: `JHD_${i}`, name: x.name, value: x.stats.confirmed };
        });
        break;
      case "USACounties":
        list = COVID19.USACounties.map((x) => {
          let conf = x.confirmed;
          return {
            id: conf.countyFIPS,
            name: `${conf["County Name"]}, ${conf.State}`,
            value: conf[viewingDate],
          };
        });
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
    list.forEach((x) => {
      $(`.list`).append(
        `<div id=${x.id}><div>${x.name}</div><div>${x.value}</div></div>`
      );
      $(`.list > #${x.id}`).click(function () {
        let e;
        switch (covType) {
          case "Countries":
            e = countryGeometries.entities.values.filter((e) => {
              return e.id.split("_")[0] === x.id;
            });
            break;
          case "Countries_States":
            e = JHDEntities.entities.values.find((e) => e.id === x.id);
            break;
          case "USACounties":
            e = USACountiesEntities.entities.values.find(
              (e) => +e.fips === +x.id
            );
            break;
        }
        selectEntity(e);
      });
      $(`.list > #${x.id}`).on("mouseover", function () {
        let e;
        switch (covType) {
          case "Countries":
            e = countryGeometries.entities.values.filter((e) => {
              return e.id.split("_")[0] === x.id;
            });
            break;
          case "Countries_States":
            e = JHDEntities.entities.values.find((e) => e.id === x.id);
            break;
          case "USACounties":
            e = USACountiesEntities.entities.values.find(
              (e) => +e.fips === +x.id
            );
            break;
        }
        hoverEntity(e);
      });

      $(`.list > #${x.id}`).on("mouseout", function () {
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
    if (e && e.id) {
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
        position = new Cesium.Cartesian3.fromDegrees(centroid[0], centroid[1]);
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
      legendHidden = false;
    } else {
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
