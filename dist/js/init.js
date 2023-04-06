// 常量
const POW_TIMES = 3; // 滚动条曲线（暂时采用三次方曲线）
const YEAR_TIME_LENGTH = 31536000000; // 一年的时长
const MONTH_TIME_LENGTH = 2678400000; // 一个月的时长
const DAY_TIME_LENGTH = 86400000; // 一天的时长
const HOUR_TIME_LENGTH = 3600000; // 一小时的时长
const MAX_VIEW_PROPORTION = 0.9; // 当单块时间占据90%的显示区域，进入下一级，如年-->月

// 根据DATA计算得出的常量
let START_TIME; // 最先上传时间
let END_TIME; // 最后上传时间
let TOTAL_TIME; // 上传时间总间隔
let EACH_TIME_ARRAY; // 分别以年/月/日/小时为单位分割时间线得到的数组
let DATA; // 数据源

// html元素
let doc_canvas;
let doc_ctx;
let doc_timeline_canvas;
let doc_left_drag;
let doc_right_drag;
let doc_grip;
let doc_slider;
let doc_timeline_legend;
let doc_cut_off_rule;

// 变量
let left = 0; // 左侧拖动按钮位置百分比
let right = 1; // 右侧拖动按钮位置百分比
let middleDraglayerX = 0; // 中间滑块鼠标按下时偏移量

function init(data = []) {
  DATA = data; // 赋值全局常量
  calculatedConstant();
  getDoc();
  initCanvasAndScroll();
  setAction();
  draw(0, 1);
}

/**
 * @description 通过DATA计算常量
 */
function calculatedConstant() {
  const timeArray = getStartEndTime(DATA);
  START_TIME = timeArray[0];
  END_TIME = timeArray[1];
  TOTAL_TIME = END_TIME.getTime() - START_TIME.getTime();
  EACH_TIME_ARRAY = getTimeArray();
}

/**
 * @description 获取页面元素
 */
function getDoc() {
  doc_timeline_canvas = document.getElementById("timelineCanvas");
  doc_canvas = document.getElementById("timeline");
  doc_ctx = doc_canvas.getContext("2d");
  doc_left_drag = document.getElementById("leftDrag");
  doc_right_drag = document.getElementById("rightDrag");
  doc_grip = document.getElementById("grip");
  doc_slider = document.getElementById("slider");
  doc_timeline_legend = document.getElementById("timelineLegend");
  doc_cut_off_rule = document.getElementById("cutOffRule");
}

/**
 * @description 初始化画布和滚动条
 */
function initCanvasAndScroll() {
  // 初始化画布
  doc_canvas.height = 10 + DATA.length * 30;
  doc_canvas.width = timelineCanvas.clientWidth;
  // 滑块区域宽度
  const sliderWidth = doc_slider.offsetWidth;
  // 初始化可视化组件
  doc_right_drag.style.left = sliderWidth + "px";
  doc_left_drag.style.left = "0";
  doc_grip.style.left = "0";
  doc_grip.style.width = sliderWidth + "px";
}

/**
 * @description 禁止图片选中
 */
function disableImageSelection() {
  document.onmousemove = function (event) {
    window.getSelection
      ? window.getSelection().removeAllRanges()
      : document.getSelection.empty();
  };
}

/**
 * @description 设置组件响应事件
 */
function setAction() {
  // 添加鼠标抬起事件
  document.addEventListener("mouseup", mouseUp);
  // 添加鼠标点击事件
  doc_left_drag.onmousedown = function () {
    document.addEventListener("mousemove", leftDragMousemove);
  };
  doc_right_drag.onmousedown = function () {
    document.addEventListener("mousemove", rightDragMousemove);
  };
  doc_grip.onmousedown = function (event) {
    middleDraglayerX = event.layerX;
    document.addEventListener("mousemove", middleDragMousemove);
  };
  doc_cut_off_rule.onmousedown = function () {
    document.addEventListener("mousemove", cutOffRuleMousemove);
  };
  // 拖动时禁止图片选中
  disableImageSelection();
  // 窗口大小变更监听
  window.onresize = resizeScroll;
}

/**
 * @description 调整canvas和scroll的宽度
 */
function resizeScroll() {
  const sliderWidth = doc_slider.offsetWidth;
  doc_canvas.width = doc_timeline_canvas.clientWidth;
  doc_grip.style.left = doc_left_drag.style.left = sliderWidth * left + "px";
  doc_right_drag.style.left = sliderWidth * right + "px";
  doc_grip.style.width = (right - left) * sliderWidth + "px";
  draw(left, Math.pow(right - left, POW_TIMES), DATA);
}

/**
 * @description 绘制图像
 * @param {*} offset 偏移量（百分比）
 * @param {*} times 放大倍数
 */
function draw(offset, times) {
  doc_ctx.clearRect(0, 0, doc_canvas.width, doc_canvas.height);
  if (YEAR_TIME_LENGTH / TOTAL_TIME / times < MAX_VIEW_PROPORTION) {
    drawRect(offset, times, EACH_TIME_ARRAY.yearArray);
  } else if (MONTH_TIME_LENGTH / TOTAL_TIME / times < MAX_VIEW_PROPORTION) {
    drawRect(offset, times, EACH_TIME_ARRAY.monthArray);
  } else if (DAY_TIME_LENGTH / TOTAL_TIME / times < MAX_VIEW_PROPORTION) {
    drawRect(offset, times, EACH_TIME_ARRAY.dayArray);
  } else {
    drawRect(offset, times, EACH_TIME_ARRAY.hourArray);
  }
  drawLine();
}

/**
 * @description 绘制矩形（背景-时间）
 * @param {*} offset 偏移量（百分比）
 * @param {*} times 放大倍数
 * @param {*} timeArray 时间间隔数组
 */
function drawRect(offset, times, timeArray) {
  let leftPointer = 0;
  for (let i = 0; i < timeArray.length; i++) {
    let rectWidth = (doc_canvas.width * timeArray[i].interval) / times;
    doc_ctx.fillStyle =
      i % 2 === 0 ? "rgb(238, 238, 238)" : "rgb(255, 255, 255)";
    doc_ctx.fillRect(
      leftPointer - (offset * doc_canvas.width) / times,
      0,
      rectWidth,
      doc_canvas.height
    );
    leftPointer += rectWidth;
  }
}

/**
 * @description 绘制时间线
 */
function drawLine() {
  doc_ctx.fillStyle = "rgb(84, 110, 122)";
  DATA.forEach((item, index) => {
    doc_ctx.fillRect(4, 19 + index * 30, doc_canvas.width - 8, 2);
  });
}

/**
 * @description 左侧滑块移动事件
 * @param {*} event 事件详情
 */
function leftDragMousemove(event) {
  const sliderLeft = doc_slider.offsetLeft;
  const sliderWidth = doc_slider.offsetWidth;
  const left2 = (event.x - sliderLeft) / sliderWidth;
  let rightDragLeft = doc_right_drag.style.left?.replace("px", "") || "0";
  if (
    event.x - sliderLeft >= 0 &&
    event.x - sliderLeft <= parseInt(rightDragLeft) - 20 &&
    HOUR_TIME_LENGTH / TOTAL_TIME / Math.pow(right - left2, POW_TIMES) <
      MAX_VIEW_PROPORTION
  ) {
    grip.style.left = doc_left_drag.style.left = event.x - sliderLeft + "px";
    grip.style.width = rightDragLeft - event.x + sliderLeft + "px";
    left = left2;
    draw(left, Math.pow(right - left, POW_TIMES));
  }
}

/**
 * @description 右侧滑块移动事件
 * @param {*} event 事件详情
 */
function rightDragMousemove(event) {
  const sliderLeft = doc_slider.offsetLeft;
  const sliderWidth = doc_slider.offsetWidth;
  const right2 = (event.x - sliderLeft) / sliderWidth;
  let leftDragLeft = doc_left_drag.style.left?.replace("px", "") || "0";
  if (
    event.x - sliderLeft <= sliderWidth &&
    event.x - sliderLeft >= parseInt(leftDragLeft) + 20 &&
    HOUR_TIME_LENGTH / TOTAL_TIME / Math.pow(right2 - left, POW_TIMES) <
      MAX_VIEW_PROPORTION
  ) {
    doc_right_drag.style.left = event.x - sliderLeft + "px";
    grip.style.width = event.x - sliderLeft - leftDragLeft + "px";
    right = right2;
    draw(left, Math.pow(right - left, POW_TIMES));
  }
}

/**
 * @description 中间滑块移动事件
 * @param {*} event 事件详情
 */
function middleDragMousemove(event) {
  const sliderLeft = doc_slider.offsetLeft;
  const sliderWidth = doc_slider.offsetWidth;
  let dragWidth = grip.style.width?.replace("px", "") || "0";
  let dragLeft = event.x - sliderLeft - middleDraglayerX;
  if (dragLeft >= 0 && dragLeft + parseInt(dragWidth) <= sliderWidth) {
    grip.style.left = doc_left_drag.style.left = dragLeft + "px";
    doc_right_drag.style.left = dragLeft + parseInt(dragWidth) + "px";
    left = dragLeft / sliderWidth;
    right = (dragLeft + parseInt(dragWidth)) / sliderWidth;
    draw(left, Math.pow(right - left, POW_TIMES));
  }
}

/**
 * @description cut-off-rule中间挡板拖动事件
 * @param {*} event 事件详情
 */
function cutOffRuleMousemove(event) {
  doc_timeline_legend.style.width =
    event.x - doc_timeline_legend.offsetLeft - 10 + "px";
  resizeScroll();
}

/**
 * @description 鼠标抬起事件，删除移动监听
 */
function mouseUp() {
  document.removeEventListener("mousemove", leftDragMousemove);
  document.removeEventListener("mousemove", rightDragMousemove);
  document.removeEventListener("mousemove", middleDragMousemove);
  document.removeEventListener("mousemove", cutOffRuleMousemove);
}

/**
 * @description 获取不同时间单位的数组
 * @returns 返回时间间隔分别为年/月/日/小时的时间数组
 */
function getTimeArray() {
  let yearArray = getYearArray(START_TIME, END_TIME, TOTAL_TIME);
  let monthArray = [];
  let dayArray = [];
  let hourArray = [];
  yearArray.forEach((item) => {
    monthArray = [
      ...monthArray,
      ...getMonthArray(item.startTime, item.endTime, TOTAL_TIME),
    ];
  });
  monthArray.forEach((item) => {
    dayArray = [
      ...dayArray,
      ...getDayArray(item.startTime, item.endTime, TOTAL_TIME),
    ];
  });
  dayArray.forEach((item) => {
    hourArray = [
      ...hourArray,
      ...getHourArray(item.startTime, item.endTime, TOTAL_TIME),
    ];
  });
  return {
    yearArray,
    monthArray,
    dayArray,
    hourArray,
  };
}

/**
 * @description 获取年为单位的时间数组
 * @param {*} startTime 开始时间
 * @param {*} endTime 结束时间
 * @param {*} totalTime 开始时间到结束时间的总时长
 * @returns 返回时间间隔为年的时间数组
 */
function getYearArray(startTime, endTime, totalTime) {
  let startYear = startTime.getFullYear();
  let endYear = endTime.getFullYear();
  let yearArray = [];
  for (let i = startYear; i <= endYear; i++) {
    let yearItem = {};
    if (i === startYear && i === endYear) {
      yearItem.startTime = startTime;
      yearItem.endTime = endTime;
    } else if (i === startYear) {
      yearItem.startTime = startTime;
      yearItem.endTime = new Date(i + 1 + "/01/01 00:00");
    } else if (i === endYear) {
      yearItem.startTime = new Date(i + "/01/01 00:00");
      yearItem.endTime = endTime;
    } else {
      yearItem.startTime = new Date(i + "/01/01 00:00");
      yearItem.endTime = new Date(i + 1 + "/01/01 00:00");
    }
    yearItem.interval =
      (yearItem.endTime.getTime() - yearItem.startTime.getTime()) / totalTime;
    yearArray.push(yearItem);
  }
  return yearArray;
}

/**
 * @description 获取月为单位的时间数组
 * @param {*} startTime 开始时间
 * @param {*} endTime2 结束时间
 * @param {*} totalTime 开始时间到结束时间的总时长
 * @returns 返回时间间隔为月的时间数组
 */
function getMonthArray(startTime, endTime2, totalTime) {
  let endTime = new Date(endTime2.getTime() - 1);
  let startMonth = startTime.getMonth() + 1;
  let endMonth = endTime.getMonth() + 1;
  let monthArray = [];
  for (let i = startMonth; i <= endMonth; i++) {
    let monthItem = {};
    if (i === startMonth && i === endMonth) {
      monthItem.startTime = startTime;
      monthItem.endTime = endTime2;
    } else if (i === startMonth) {
      monthItem.startTime = startTime;
      monthItem.endTime = new Date(
        startTime.getFullYear() + "/" + (i + 1) + "/01 00:00"
      );
    } else if (i === endMonth) {
      monthItem.startTime = new Date(
        startTime.getFullYear() + "/" + i + "/01 00:00"
      );
      monthItem.endTime = endTime2;
    } else {
      monthItem.startTime = new Date(
        startTime.getFullYear() + "/" + i + "/01 00:00"
      );
      monthItem.endTime = new Date(
        startTime.getFullYear() + "/" + (i + 1) + "/01 00:00"
      );
    }
    monthItem.interval =
      (monthItem.endTime.getTime() - monthItem.startTime.getTime()) / totalTime;
    monthArray.push(monthItem);
  }
  return monthArray;
}

/**
 * @description 获取日为单位的时间数组
 * @param {*} startTime 开始时间
 * @param {*} endTime2 结束时间
 * @param {*} totalTime 开始时间到结束时间的总时长
 * @returns 返回时间间隔为日的时间数组
 */
function getDayArray(startTime, endTime2, totalTime) {
  let endTime = new Date(endTime2.getTime() - 1);
  let year = startTime.getFullYear();
  let month = startTime.getMonth() + 1;
  let startDay = startTime.getDate();
  let endDay = endTime.getDate();
  let dayArray = [];
  for (let i = startDay; i <= endDay; i++) {
    let dayItem = {};
    if (i === startDay && i === endDay) {
      dayItem.startTime = startTime;
      dayItem.endTime = endTime2;
    } else if (i === startDay) {
      dayItem.startTime = startTime;
      dayItem.endTime = new Date(year + "/" + month + "/" + (i + 1) + " 00:00");
    } else if (i === endDay) {
      dayItem.startTime = new Date(year + "/" + month + "/" + i + " 00:00");
      dayItem.endTime = endTime2;
    } else {
      dayItem.startTime = new Date(year + "/" + month + "/" + i + " 00:00");
      dayItem.endTime = new Date(year + "/" + month + "/" + (i + 1) + " 00:00");
    }
    dayItem.interval =
      (dayItem.endTime.getTime() - dayItem.startTime.getTime()) / totalTime;
    dayArray.push(dayItem);
  }
  return dayArray;
}

/**
 * @description 获取小时为单位的时间数组
 * @param {*} startTime 开始时间
 * @param {*} endTime2 结束时间
 * @param {*} totalTime 开始时间到结束时间的总时长
 * @returns 返回时间间隔为小时的时间数组
 */
function getHourArray(startTime, endTime2, totalTime) {
  let endTime = new Date(endTime2.getTime() - 1);
  let year = startTime.getFullYear();
  let month = startTime.getMonth() + 1;
  let day = startTime.getDate();
  let startHour = startTime.getHours();
  let endHour = endTime.getHours();
  let hourArray = [];
  for (let i = startHour; i <= endHour; i++) {
    let hourItem = {};
    if (i === startHour && i === endHour) {
      hourItem.startTime = startTime;
      hourItem.endTime = endTime2;
    } else if (i === startHour) {
      hourItem.startTime = startTime;
      hourItem.endTime = new Date(
        year + "/" + month + "/" + day + " " + (i + 1) + ":00"
      );
    } else if (i === endHour) {
      hourItem.startTime = new Date(
        year + "/" + month + "/" + day + " " + i + ":00"
      );
      hourItem.endTime = endTime2;
    } else {
      hourItem.startTime = new Date(
        year + "/" + month + "/" + day + " " + i + ":00"
      );
      hourItem.endTime = new Date(
        year + "/" + month + "/" + day + " " + (i + 1) + ":00"
      );
    }
    hourItem.interval =
      (hourItem.endTime.getTime() - hourItem.startTime.getTime()) / totalTime;
    hourArray.push(hourItem);
  }
  return hourArray;
}

/**
 * @description 从DATA中获取开始和结束时间（如果没有，设置默认时间）
 * @returns 返回包含开始时间和结束时间的数组
 */
function getStartEndTime() {
  let startTime;
  let endTime;
  DATA.forEach((item) => {
    if (item?.uploadHistory?.length > 0) {
      item.uploadHistory.forEach((fileItem) => {
        startTime = startTime
          ? startTime.getTime() < fileItem.uploadTime.getTime()
            ? startTime
            : fileItem.uploadTime
          : fileItem.uploadTime;
        endTime = endTime
          ? endTime.getTime() > fileItem.uploadTime.getTime()
            ? endTime
            : fileItem.uploadTime
          : fileItem.uploadTime;
      });
    }
  });
  if (!startTime) startTime = new Date("2023/01/01 00:00");
  if (!endTime) endTime = new Date();
  if (startTime.getTime() === endTime.getTime()) {
    startTime = new Date(startTime.getTime() - 3600000);
    endTime = new Date(endTime.getTime() + 3600000);
  }
  return [startTime, endTime];
}

module.exports.init = init;
