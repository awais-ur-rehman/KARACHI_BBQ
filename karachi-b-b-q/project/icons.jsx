/* Icons — Lucide-style 1.8px stroke, currentColor */
(function () {
  const I = (paths, vb) => (p = {}) => {
    const { size = 18, sw = 1.8, ...rest } = p;
    return React.createElement("svg", {
      width: size, height: size, viewBox: vb || "0 0 24 24", fill: "none",
      stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", ...rest,
    }, paths.map((d, i) => React.createElement("path", { key: i, d })));
  };
  const multi = (els, vb) => (p = {}) => {
    const { size = 18, sw = 1.8, ...rest } = p;
    return React.createElement("svg", { width: size, height: size, viewBox: vb || "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", ...rest }, els);
  };
  const e = React.createElement;

  window.Icon = {
    dashboard: I(["M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z"]),
    counter: multi([e("rect",{key:0,x:3,y:3,width:18,height:18,rx:2}),e("path",{key:1,d:"M3 9h18M9 9v12"})]),
    cart: multi([e("circle",{key:0,cx:9,cy:21,r:1}),e("circle",{key:1,cx:19,cy:21,r:1}),e("path",{key:2,d:"M2.5 3h2l2.2 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"})]),
    receipt: I(["M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5 4 2z","M8 7h8M8 11h8M8 15h5"]),
    orders: I(["M8 6h13M8 12h13M8 18h13","M3 6h.01M3 12h.01M3 18h.01"]),
    box: multi([e("path",{key:0,d:"M21 8l-9-5-9 5v8l9 5 9-5V8z"}),e("path",{key:1,d:"M3.3 7L12 12l8.7-5M12 12v9.5"})]),
    boxes: I(["M3 9l9-6 9 6v6l-9 6-9-6V9z","M3 9l9 6 9-6"]),
    tag: multi([e("path",{key:0,d:"M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"}),e("circle",{key:1,cx:7.5,cy:7.5,r:1.3})]),
    chef: I(["M6 17h12v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-3z","M6 17a4 4 0 0 1-1-7.9A4 4 0 0 1 12 5a4 4 0 0 1 7 4.1A4 4 0 0 1 18 17z"]),
    truck: multi([e("path",{key:0,d:"M1 3h13v13H1zM14 8h4l3 3v5h-7"}),e("circle",{key:1,cx:5.5,cy:18.5,r:1.8}),e("circle",{key:2,cx:17.5,cy:18.5,r:1.8})]),
    clipboard: multi([e("rect",{key:0,x:4,y:4,width:16,height:18,rx:2}),e("path",{key:1,d:"M9 4V2.5h6V4M9 12h6M9 16h4"})]),
    chart: I(["M3 3v18h18","M7 15l3-4 3 3 5-7"]),
    history: I(["M3 12a9 9 0 1 0 3-6.7L3 8","M3 3v5h5","M12 8v4l3 2"]),
    users: multi([e("path",{key:0,d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}),e("circle",{key:1,cx:9,cy:7,r:4}),e("path",{key:2,d:"M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"})]),
    settings: multi([e("circle",{key:0,cx:12,cy:12,r:3}),e("path",{key:1,d:"M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"})]),
    plus: I(["M12 5v14M5 12h14"]),
    minus: I(["M5 12h14"]),
    search: multi([e("circle",{key:0,cx:11,cy:11,r:7}),e("path",{key:1,d:"M21 21l-4.3-4.3"})]),
    x: I(["M18 6 6 18M6 6l12 12"]),
    check: I(["M20 6 9 17l-5-5"]),
    chevR: I(["M9 6l6 6-6 6"]),
    chevL: I(["M15 6l-6 6 6 6"]),
    chevD: I(["M6 9l6 6 6-6"]),
    print: multi([e("path",{key:0,d:"M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"}),e("path",{key:1,d:"M6 14h12v8H6z"})]),
    trash: I(["M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6","M10 11v6M14 11v6"]),
    edit: I(["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"]),
    lock: multi([e("rect",{key:0,x:3,y:11,width:18,height:11,rx:2}),e("path",{key:1,d:"M7 11V7a5 5 0 0 1 10 0v4"})]),
    alert: multi([e("circle",{key:0,cx:12,cy:12,r:10}),e("path",{key:1,d:"M12 8v4M12 16h.01"})]),
    warn: I(["M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z","M12 9v4M12 17h.01"]),
    bell: multi([e("path",{key:0,d:"M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"}),e("path",{key:1,d:"M13.7 21a2 2 0 0 1-3.4 0"})]),
    logout: I(["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5M21 12H9"]),
    flame: I(["M12 2s4 4 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a7 7 0 0 0 14 0c0-6-8-12-8-12z"]),
    cash: multi([e("rect",{key:0,x:2,y:6,width:20,height:12,rx:2}),e("circle",{key:1,cx:12,cy:12,r:2.5}),e("path",{key:2,d:"M6 12h.01M18 12h.01"})]),
    card: multi([e("rect",{key:0,x:2,y:5,width:20,height:14,rx:2}),e("path",{key:1,d:"M2 10h20"})]),
    clock: multi([e("circle",{key:0,cx:12,cy:12,r:9}),e("path",{key:1,d:"M12 7v5l3 2"})]),
    calendar: multi([e("rect",{key:0,x:3,y:4,width:18,height:18,rx:2}),e("path",{key:1,d:"M3 9h18M8 2v4M16 2v4"})]),
    download: I(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5M12 15V3"]),
    filter: I(["M22 3H2l8 9.5V19l4 2v-8.5z"]),
    menu: I(["M3 12h18M3 6h18M3 18h18"]),
    panel: multi([e("rect",{key:0,x:3,y:3,width:18,height:18,rx:2}),e("path",{key:1,d:"M9 3v18"})]),
    arrowU: I(["M12 19V5M5 12l7-7 7 7"]),
    arrowD: I(["M12 5v14M5 12l7 7 7-7"]),
    eye: multi([e("path",{key:0,d:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"}),e("circle",{key:1,cx:12,cy:12,r:3})]),
    rotate: I(["M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8","M3 3v5h5"]),
    phone: I(["M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"]),
    pin: multi([e("path",{key:0,d:"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"}),e("circle",{key:1,cx:12,cy:10,r:3})]),
    db: multi([e("ellipse",{key:0,cx:12,cy:5,rx:9,ry:3}),e("path",{key:1,d:"M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"}),e("path",{key:2,d:"M3 12c0 1.7 4 3 9 3s9-1.3 9-3"})]),
    folder: I(["M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6l2 3h8a2 2 0 0 1 2 2z"]),
    list: I(["M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"]),
    grid: I(["M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"]),
    star: I(["M12 2l3 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.9 21l1.2-6.9-5-4.9 6.9-1z"]),
    moon: I(["M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"]),
    sun: multi([e("circle",{key:0,cx:12,cy:12,r:4}),e("path",{key:1,d:"M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"})]),
    save: I(["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z","M17 21v-8H7v8M7 3v5h8"]),
    copy: multi([e("rect",{key:0,x:9,y:9,width:13,height:13,rx:2}),e("path",{key:1,d:"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"})]),
    scale: I(["M12 3v18M5 7l-3 7h6zM19 7l-3 7h6z","M5 7h14M8 21h8"]),
    fileText: I(["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6M8 13h8M8 17h5"]),
    wallet: multi([e("path",{key:0,d:"M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}),e("path",{key:1,d:"M16 12h.01M3 8h18"})]),
    undo: I(["M3 7v6h6","M3 13a9 9 0 1 1 3 7.7"]),
    sliders: I(["M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"]),
  };
})();
