import { init } from "./dist/js/init.js";

class UploadTimeline {
  constructor(theDocument, data) {
    documentInit(theDocument, data);
    init(data);
  }
}

function documentInit(theDocument, data) {
  const timelineDrawer = document.createElement("div");
  timelineDrawer.className = "upline-timeline-drawer";

  const drawerBody = document.createElement("div");
  drawerBody.className = "upline-drawer-body";

  const timelineLegend = document.createElement("div");
  timelineLegend.className = "upline-timeline-legend";
  timelineLegend.id = "timelineLegend";
  data.forEach((item) => {
    const selectable = document.createElement("div");
    selectable.className = "upline-selectable";
    selectable.innerText = item.groupName;
    timelineLegend.appendChild(selectable);
  });

  const filterButton = document.createElement("div");
  filterButton.className = "upline-filter-button";
  const button = document.createElement("div");
  button.className = "upline-button";
  filterButton.appendChild(button);

  drawerBody.appendChild(timelineLegend);
  drawerBody.appendChild(filterButton);

  const cutOffRule = document.createElement("div");
  cutOffRule.className = "upline-cut-off-rule";
  cutOffRule.id = "cutOffRule";

  const pullTab = document.createElement("div");
  pullTab.className = "upline-pull-tab";

  const timelineCanvas = document.createElement("div");
  timelineCanvas.className = "upline-timeline-canvas";
  timelineCanvas.id = "timelineCanvas";
  const timeline = document.createElement("canvas");
  timeline.id = "timeline";
  timelineCanvas.appendChild(timeline);

  const scrollBar = document.createElement("div");
  scrollBar.className = "upline-scroll-bar";

  const scrollButton1 = document.createElement("div");
  scrollButton1.className = "upline-scroll-button upline-clickable";
  scrollButton1.style = "margin-right: 2px;";
  const img1 = document.createElement("img");
  img1.src = "/node_modules/upload-timeline/dist/img/goLeft.svg";
  scrollButton1.appendChild(img1);

  const slider = document.createElement("div");
  slider.className = "upline-slider";
  slider.id = "slider";

  const leftDrag = document.createElement("div");
  leftDrag.className = "upline-scroll-button upline-clickable";
  leftDrag.id = "leftDrag";
  const imgleftDrag = document.createElement("img");
  imgleftDrag.src = "/node_modules/upload-timeline/dist/img/drag.svg";
  imgleftDrag.style = "pointer-events: none;";
  leftDrag.appendChild(imgleftDrag);

  const grip = document.createElement("div");
  grip.className = "upline-grip upline-clickable";
  grip.id = "grip";

  const rightDrag = document.createElement("div");
  rightDrag.className = "upline-scroll-button upline-clickable";
  rightDrag.id = "rightDrag";
  const imgRightDrag = document.createElement("img");
  imgRightDrag.src = "/node_modules/upload-timeline/dist/img/drag.svg";
  imgRightDrag.style = "pointer-events: none;";
  rightDrag.appendChild(imgRightDrag);

  slider.appendChild(leftDrag);
  slider.appendChild(grip);
  slider.appendChild(rightDrag);

  const scrollButton2 = document.createElement("div");
  scrollButton2.className = "upline-scroll-button upline-clickable";
  scrollButton2.style = "margin-left: 2px;";
  const img2 = document.createElement("img");
  img2.src = "/node_modules/upload-timeline/dist/img/goRight.svg";
  scrollButton2.appendChild(img2);

  scrollBar.appendChild(scrollButton1);
  scrollBar.appendChild(slider);
  scrollBar.appendChild(scrollButton2);

  pullTab.appendChild(timelineCanvas);
  pullTab.appendChild(scrollBar);

  timelineDrawer.appendChild(drawerBody);
  timelineDrawer.appendChild(cutOffRule);
  timelineDrawer.appendChild(pullTab);
  theDocument.appendChild(timelineDrawer);
}

module.exports.UploadTimeline = UploadTimeline;
