// 常量
const YEAR_TIME_LENGTH = 31536000000; // 一年的时长
const MONTH_TIME_LENGTH = 2678400000; // 一个月的时长
const WEEK_TIME_LENGTH = 604800000; // 一周的时长
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
let doc_left_drag_time;
let doc_right_drag_time;
let doc_timeline_left;
let doc_timeline_right;

// 变量
let left = 0; // 左侧拖动按钮位置百分比
let right = 1; // 右侧拖动按钮位置百分比
let draglayerX = 0; // 中间滑块鼠标按下时偏移量
let leftTime = null; // 左侧拖动按钮表示时间
let rightTime = null; // 右侧拖动按钮表示时间
let smallMarginLeft = 0;
let smallMarginRight = 0;

const eventMap = new Map(); // 存放event

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
  doc_left_drag_time = document.getElementById("leftDragTime");
  doc_right_drag_time = document.getElementById("rightDragTime");
  doc_timeline_left = document.getElementById("timelineLeft");
  doc_timeline_right = document.getElementById("timelineRight");
}

/**
 * @description 初始化画布和滚动条
 */
function initCanvasAndScroll() {
  // 初始化画布两边背景
  for (let i = 0; i < DATA.length; i++) {
    const line = document.createElement("div");
    line.className = "upline-timeline-sideline";
    line.style.marginTop = i === 0 ? "19px" : "28px";
    doc_timeline_left.appendChild(line);
    const line2 = document.createElement("div");
    line2.className = "upline-timeline-sideline";
    line2.style.marginTop = i === 0 ? "19px" : "28px";
    doc_timeline_right.appendChild(line2);
  }
  // 初始化画布
  doc_canvas.height = 10 + DATA.length * 30;
  doc_canvas.width = timelineCanvas.clientWidth - 40; // 40为side背景宽度
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
  doc_left_drag.onmousedown = function (event) {
    draglayerX = event.x;
    document.addEventListener("mousemove", leftDragMousemove);
  };
  doc_right_drag.onmousedown = function (event) {
    draglayerX = event.x;
    document.addEventListener("mousemove", rightDragMousemove);
  };
  doc_grip.onmousedown = function (event) {
    draglayerX = event.layerX;
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
  doc_canvas.width = doc_timeline_canvas.clientWidth - 40;
  doc_grip.style.left = doc_left_drag.style.left = 0 + "px";
  doc_right_drag.style.left = sliderWidth + "px";
  doc_grip.style.width = sliderWidth + "px";
  left = 0;
  right = 1;
  smallMarginLeft = 0;
  smallMarginRight = 0;
  draw(left, right - left, DATA);
}

/**
 * @description 绘制图像
 * @param {*} offset 偏移量（百分比）
 * @param {*} times 放大倍数
 */
function draw(offset, times) {
  doc_ctx.clearRect(0, 0, doc_canvas.width, doc_canvas.height);
  if (YEAR_TIME_LENGTH / TOTAL_TIME / times < MAX_VIEW_PROPORTION) {
    drawRect(offset, times, EACH_TIME_ARRAY.yearArray, "year");
  } else if (MONTH_TIME_LENGTH / TOTAL_TIME / times < MAX_VIEW_PROPORTION) {
    drawRect(offset, times, EACH_TIME_ARRAY.monthArray, "month");
  } else if (WEEK_TIME_LENGTH / TOTAL_TIME / times < MAX_VIEW_PROPORTION) {
    drawRect(offset, times, EACH_TIME_ARRAY.weekArray, "week");
  } else if (DAY_TIME_LENGTH / TOTAL_TIME / times < MAX_VIEW_PROPORTION) {
    drawRect(offset, times, EACH_TIME_ARRAY.dayArray, "day");
  } else {
    drawRect(offset, times, EACH_TIME_ARRAY.hourArray, "hour");
  }
  drawLine();
  setLeftDragTime();
  setRightDragTime();
  drawUpload();
}

/**
 * @description 绘制矩形（背景-时间）
 * @param {*} offset 偏移量（百分比）
 * @param {*} times 放大倍数
 * @param {*} timeArray 时间间隔数组
 * @param {*} timeType 时间类型（年/月/日/小时）
 */
function drawRect(offset, times, timeArray, timeType) {
  let leftPointer = 0;
  for (let i = 0; i < timeArray.length; i++) {
    const rectWidth = (doc_canvas.width * timeArray[i].interval) / times;
    const rectLeft = leftPointer - (offset * doc_canvas.width) / times;
    // 判断是否在绘制区域内（性能优化）
    if (rectLeft < doc_canvas.width && rectLeft > -doc_canvas.width) {
      // 绘制rect
      doc_ctx.fillStyle =
        i % 2 === 0 ? "rgb(238, 238, 238)" : "rgb(255, 255, 255)";
      doc_ctx.fillRect(rectLeft, 0, rectWidth, doc_canvas.height);
      // 绘制时间text
      doc_ctx.fillStyle = "rgb(187, 187, 187)";
      doc_ctx.font = "12px Arial";
      const text = getTimeText(timeArray[i].startTime, timeType);
      const textWidth = doc_ctx.measureText(text).width;
      // 判断react长度够不够显示text
      if (textWidth < rectWidth) {
        doc_ctx.fillText(text, rectLeft + rectWidth / 2 - textWidth / 2, 38);
      }
    }
    leftPointer += rectWidth;
  }
}

/**
 *
 * @param {*} time DATE信息
 * @param {*} timeType 时间类型
 * @returns 返回显示在时间线上的时间文本
 */
function getTimeText(time, timeType) {
  let text = "";
  if (timeType === "year") {
    text = time.getFullYear() + "年";
  } else if (timeType === "month") {
    text = time.getMonth() + 1 + "月";
  } else if (timeType === "week") {
    text = getWeek(time) + "周";
  } else if (timeType === "day") {
    text = formateDate(time);
  } else if (timeType === "hour") {
    text = time.getHours();
  }
  return text;
}

/**
 * @description 绘制时间线
 */
function drawLine() {
  doc_ctx.fillStyle = "rgb(84, 110, 122)";
  DATA.forEach((item, index) => {
    doc_ctx.fillRect(0, 19 + index * 30, doc_canvas.width, 2);
  });
}

/**
 * @description 左侧滑块移动事件
 * @param {*} event 事件详情
 */
function leftDragMousemove(event) {
  const diff = event.x - draglayerX;
  if (diff === 0) return;
  const sliderLeft = doc_slider.offsetLeft;
  const sliderWidth = doc_slider.offsetWidth;
  const rightDragLeft = parseInt(
    doc_right_drag.style.left?.replace("px", "") || "0"
  );
  const leftDragLeft = parseInt(
    doc_left_drag.style.left?.replace("px", "") || "0"
  );

  // 计算实际位置
  let eventX = leftDragLeft + sliderLeft + diff;

  // 当进入微调，且正在拉长时间线，且微调值不为0时
  if (grip.offsetWidth === 20 && diff < 0 && smallMarginLeft !== 0) {
    smallMarginLeft += diff;
  } else {
    // eventX限制条件
    eventX = Math.max(eventX, sliderLeft); // > 0
    eventX = Math.min(eventX, sliderLeft + rightDragLeft - 20); // > 0
    eventX = Math.min(eventX, rightDragLeft + sliderLeft); // < rightDragLeft
    // 显示hour为单位的时间线时，单个时间块最多占整个view的MAX_VIEW_PROPORTION
    eventX = Math.min(
      eventX,
      (right - HOUR_TIME_LENGTH / TOTAL_TIME / MAX_VIEW_PROPORTION) *
        sliderWidth +
        sliderLeft
    );

    // 判断是否进入微调，且正在缩短时间线
    if (grip.offsetWidth === 20) {
      smallMarginLeft += diff;
      smallMarginLeft = Math.min(
        smallMarginLeft,
        (right - HOUR_TIME_LENGTH / TOTAL_TIME / MAX_VIEW_PROPORTION) *
          sliderWidth +
          sliderLeft -
          eventX
      );
    }

    // 改变视图
    grip.style.left = doc_left_drag.style.left = eventX - sliderLeft + "px";
    grip.style.width = rightDragLeft - eventX + sliderLeft + "px";
  }

  smallMarginLeft = Math.max(smallMarginLeft, 0);
  left = (eventX + smallMarginLeft - sliderLeft) / sliderWidth;
  draw(left, right - left);
  draglayerX = event.x;
}

/**
 * @description 右侧滑块移动事件
 * @param {*} event 事件详情
 */
function rightDragMousemove(event) {
  const diff = event.x - draglayerX;
  if (diff === 0) return;
  const sliderLeft = doc_slider.offsetLeft;
  const sliderWidth = doc_slider.offsetWidth;
  const leftDragLeft = parseInt(
    doc_left_drag.style.left?.replace("px", "") || "0"
  );
  const rightDragLeft = parseInt(
    doc_right_drag.style.left?.replace("px", "") || "0"
  );

  // 计算实际位置
  let eventX = rightDragLeft + sliderLeft + diff;

  // 当进入微调，且正在拉长时间线，且微调值不为0时
  if (grip.offsetWidth === 20 && diff > 0 && smallMarginRight !== 0) {
    smallMarginRight += diff;
  } else {
    // eventX限制条件
    eventX = Math.min(eventX, sliderWidth + sliderLeft);
    eventX = Math.max(eventX, leftDragLeft + sliderLeft + 20);
    eventX = Math.max(
      eventX,
      (left + HOUR_TIME_LENGTH / TOTAL_TIME / MAX_VIEW_PROPORTION) *
        sliderWidth +
        sliderLeft
    );

    // 判断是否进入微调，且正在缩短时间线
    if (grip.offsetWidth === 20) {
      smallMarginRight += diff;
      smallMarginRight = Math.max(
        smallMarginRight,
        (left + HOUR_TIME_LENGTH / TOTAL_TIME / MAX_VIEW_PROPORTION) *
          sliderWidth +
          sliderLeft -
          eventX
      );
    }

    // 改变视图
    doc_right_drag.style.left = eventX - sliderLeft + "px";
    grip.style.width = eventX - sliderLeft - leftDragLeft + "px";
  }
  smallMarginRight = Math.min(smallMarginRight, 0);
  right = (eventX + smallMarginRight - sliderLeft) / sliderWidth;
  draw(left, right - left);
  draglayerX = event.x;
}

/**
 * @description 中间滑块移动事件
 * @param {*} event 事件详情
 */
function middleDragMousemove(event) {
  const sliderLeft = doc_slider.offsetLeft;
  const sliderWidth = doc_slider.offsetWidth;
  const dragWidth = grip.style.width?.replace("px", "") || "0";
  let eventX = Math.max(event.x, draglayerX + sliderLeft);
  eventX = Math.min(
    eventX,
    sliderWidth - parseInt(dragWidth) + sliderLeft + draglayerX
  );
  const dragLeft = eventX - sliderLeft - draglayerX;
  grip.style.left = doc_left_drag.style.left = dragLeft + "px";
  doc_right_drag.style.left = dragLeft + parseInt(dragWidth) + "px";
  // 利用原始差值计算right
  const difference = right - left;
  left = (dragLeft + smallMarginLeft) / sliderWidth;
  right = left + difference;
  draw(left, right - left);
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
  let weekArray = [];
  let dayArray = [];
  let hourArray = [];
  yearArray.forEach((item) => {
    monthArray = [
      ...monthArray,
      ...getMonthArray(item.startTime, item.endTime, TOTAL_TIME),
    ];
    weekArray = [
      ...weekArray,
      ...getWeekArray(item.startTime, item.endTime, TOTAL_TIME),
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
    weekArray,
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
  const startYear = startTime.getFullYear();
  const endYear = endTime.getFullYear();
  const yearArray = [];
  for (let i = startYear; i <= endYear; i++) {
    const yearItem = {};
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
  const endTime = new Date(endTime2.getTime() - 1);
  const startMonth = startTime.getMonth() + 1;
  const endMonth = endTime.getMonth() + 1;
  const monthArray = [];
  for (let i = startMonth; i <= endMonth; i++) {
    const monthItem = {};
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
 * @description 获取周为单位的时间数组
 * @param {*} startTime 开始时间
 * @param {*} endTime2 结束时间
 * @param {*} totalTime 开始时间到结束时间的总时长
 * @returns 返回时间间隔为周的时间数组
 */
function getWeekArray(startTime, endTime2, totalTime) {
  const endTime = new Date(endTime2.getTime() - 1);
  const startWeek = getWeek(startTime);
  const endWeek = getWeek(endTime);
  const weekArray = [];
  const startDay = getFirstWeekTime(startTime);
  for (let i = startWeek; i <= endWeek; i++) {
    const weekItem = {};
    if (i === startWeek && i === endWeek) {
      weekItem.startTime = startTime;
      weekItem.endTime = endTime2;
    } else if (i === startWeek) {
      weekItem.startTime = startTime;
      weekItem.endTime = new Date(
        startDay.getTime() + (i - 1) * WEEK_TIME_LENGTH
      );
    } else if (i === endWeek) {
      weekItem.startTime = new Date(
        startDay.getTime() + (i - 2) * WEEK_TIME_LENGTH
      );
      weekItem.endTime = endTime2;
    } else {
      weekItem.startTime = new Date(
        startDay.getTime() + (i - 2) * WEEK_TIME_LENGTH
      );
      weekItem.endTime = new Date(
        startDay.getTime() + (i - 1) * WEEK_TIME_LENGTH
      );
    }
    weekItem.interval =
      (weekItem.endTime.getTime() - weekItem.startTime.getTime()) / totalTime;
    weekArray.push(weekItem);
  }
  return weekArray;
}

/**
 * @description 获取日为单位的时间数组
 * @param {*} startTime 开始时间
 * @param {*} endTime2 结束时间
 * @param {*} totalTime 开始时间到结束时间的总时长
 * @returns 返回时间间隔为日的时间数组
 */
function getDayArray(startTime, endTime2, totalTime) {
  const endTime = new Date(endTime2.getTime() - 1);
  const year = startTime.getFullYear();
  const month = startTime.getMonth() + 1;
  const startDay = startTime.getDate();
  const endDay = endTime.getDate();
  const dayArray = [];
  for (let i = startDay; i <= endDay; i++) {
    const dayItem = {};
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
  const endTime = new Date(endTime2.getTime() - 1);
  const year = startTime.getFullYear();
  const month = startTime.getMonth() + 1;
  const day = startTime.getDate();
  const startHour = startTime.getHours();
  const endHour = endTime.getHours();
  const hourArray = [];
  for (let i = startHour; i <= endHour; i++) {
    const hourItem = {};
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

/**
 * @description 根据时间计算当前时间是一年中的第几周
 * @param {*} time 时间
 * @returns 返回第几周
 */
function getWeek(time) {
  const startDay = getFirstWeekTime(time);
  let weekNum = 1;
  if (time.getTime() >= startDay.getTime()) {
    weekNum =
      Math.floor((time.getTime() - startDay.getTime()) / WEEK_TIME_LENGTH) + 2;
  }
  return weekNum;
}

/**
 * @description 获取当前年第一个周一
 * @param {*} time 时间
 * @returns 返回Date
 */
function getFirstWeekTime(time) {
  const year = time.getFullYear();
  const firstDay = new Date(year + "/01/01 00:00");
  const firstWeekNum = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
  const startDay =
    firstWeekNum === 1
      ? firstDay
      : new Date(year + "/01/" + (9 - firstWeekNum) + " 00:00");
  return startDay;
}

/**
 * @description 设置leftDrag的时间点
 */
function setLeftDragTime() {
  leftTime = new Date(START_TIME.getTime() + left * TOTAL_TIME);
  doc_left_drag_time.innerText = formateDate(leftTime);
  doc_left_drag_time.style.left = doc_left_drag.style.left;
}

/**
 * @description 设置rightDrag的时间点
 */
function setRightDragTime() {
  rightTime = new Date(START_TIME.getTime() + right * TOTAL_TIME);
  doc_right_drag_time.innerText = formateDate(rightTime);
  doc_right_drag_time.style.left = doc_right_drag.style.left;
}

/**
 * @description 时间格式转换成 yyyy/mm/dd
 * @param {*} time 时间
 */
function formateDate(time) {
  const year = time.getFullYear();
  const month =
    time.getMonth() > 8 ? time.getMonth() + 1 : "0" + (time.getMonth() + 1);
  const day = time.getDate() > 9 ? time.getDate() : "0" + time.getDate();
  return year + "/" + month + "/" + day;
}

/**
 * @description 绘制上传的文件
 */
function drawUpload() {
  const totalTime = rightTime.getTime() - leftTime.getTime();
  DATA.forEach((team, index) => {
    team.uploadHistory.forEach((history) => {
      const eventItem = eventMap.get(history.uploadTime);
      // 如果在显示范围内
      if (history.uploadTime >= leftTime && history.uploadTime <= rightTime) {
        // 左边距（百分比）
        const marginLeft =
          (history.uploadTime.getTime() - leftTime.getTime()) / totalTime;
        // 维护eventMap
        if (eventItem) {
          eventItem.style.left = marginLeft * doc_canvas.width + 10 + "px";
        } else {
          // 如果eventMap中没有，则创建一个
          const event = document.createElement("div");
          event.className = "upline-event";
          event.style.top = index * 30 + 10 + "px";
          event.style.left = marginLeft * doc_canvas.width + 10 + "px";
          doc_timeline_canvas.appendChild(event);
          eventMap.set(history.uploadTime, event);
          setTimeout(() => {
            event.style.width = "20px";
            event.style.height = "20px";
          });
        }
      } else {
        if (eventItem) {
          eventItem.style.width = "0";
          eventItem.style.height = "0";
          eventMap.set(history.uploadTime, null);
          setTimeout(() => {
            eventItem.remove();
          }, 200);
        }
      }
    });
  });
}

module.exports.init = init;
