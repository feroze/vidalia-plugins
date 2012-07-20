importExtension("qt");
importExtension("qt.core");
importExtension("qt.gui");

HOR_SPC = 2;   /** Space between data points */
MIN_SCALE = 10;  /** 10 kB/s is the minimum scale */
SCROLL_STEP = 4;   /** Horizontal change on graph update */

BACK_COLOR = new QColor(Qt.black);
SCALE_COLOR = new QColor(Qt.green);
GRID_COLOR = new QColor(Qt.darkGreen);
RECV_COLOR = new QColor(Qt.cyan);
SEND_COLOR = new QColor(Qt.yellow);

FONT_SIZE = 11;

SolidLine = 0;
AreaGraph = 1;

// TODO: support translations
function tr(s) { return s; }

function GraphFrame(parent)
{
  QFrame.call(this, parent);

  /* Create Graph Frame related objects */
  this.recvData = [];
  this.sendData = [];
  this.painter = new QPainter();
  this.graphStyle = AreaGraph;

  /* Initialize graph values */
  this.recvData.unshift(0);
  this.sendData.unshift(0);
  this.maxPoints = this.getNumPoints();
  this.maxPosition = 0;
  this.showRecv = true;
  this.showSend = true;
  this.maxValue = MIN_SCALE;
  this.scaleWidth = 0;
  this.totalSend = 0;
  this.totalRecv = 0;
}

GraphFrame.prototype = new QFrame();

/** Gets the width of the desktop, which is the maximum number of points
 * we can plot in the graph. */
GraphFrame.prototype.getNumPoints = function()
{
  return this.size - this.scaleWidth;
}

/** Adds new data points to the graph. */
GraphFrame.prototype.addPoints = function(recv, send)
{
  /* If maximum number of points plotted, remove oldest */
  if (this.sendData.length == this.maxPoints) {
    this.sendData.pop();
    this.recvData.pop();
  }

  /* Update the displayed maximum */
  if (this.maxPosition >= this.maxPoints) {
    this.maxValue = MIN_SCALE;
    for(send in this.sendData) {
      if(send > this.maxValue)
        this.maxValue = send;
    }
    for(recv in this.recvData) {
      if(recv > this.maxValue)
        this.maxValue = recv;
    }
    this.maxPosition = 0;
  }

  /* Add the points to their respective lists */
  this.sendData.unshift(send);
  this.recvData.unshift(recv);

  /* Add to the total counters */
  this.totalSend += send;
  this.totalRecv += recv;

  var maxUpdated = false;
  /* Check for a new maximum value */
  if (send > this.maxValue) {
    this.maxValue = send;
    maxUpdated = true;
  }

  if (recv > this.maxValue) {
    this.maxValue = recv;
    maxUpdated = true;
  }

  if (maxUpdated) {
    this.maxPosition = 0;
  } else {
    this.maxPosition++;
  }

  this.update();
}

/** Clears the graph. */
GraphFrame.prototype.resetGraph = function()
{
  this.recvData = [];
  this.sendData = [];
  this.recvData.unshift(0);
  this.sendData.unshift(0);
  this.maxValue = MIN_SCALE;
  this.totalSend = 0;
  this.totalRecv = 0;
  this.update();
}

/** Toggles display of respective graph lines and counters. */
GraphFrame.prototype.setShowCounters = function(showRecv, showSend)
{
  this.showRecv = showRecv;
  this.showSend = showSend;
}

/** Returns a list of points on the bandwidth graph based on the supplied set
 * of send or receive values. */
GraphFrame.prototype.pointsFromData = function(list)
{
  var points = new Array();
  var x = this.frameRect.width();
  var y = this.frameRect.height();
  var scale = (y - (y/10)) / this.maxValue;
  var currValue = 0;

  /* Translate all data points to points on the graph frame */
  points.push(new QPointF(x, y));
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    currValue = y - (item * scale);
    if (x - SCROLL_STEP < this.scaleWidth) {
      points.push(new QPointF(this.scaleWidth, currValue));
      break;
    }
    points.push(new QPointF(x, currValue));
    x -= SCROLL_STEP;
  }
  points.push(new QPointF(this.scaleWidth, y));
  return points;
}

/** Returns the width in pixels of <b>label</b> using the current painter's
 * font. */
GraphFrame.prototype.labelWidth = function(label)
{
  var width = 0;
  var fm = new QFontMetrics(this.font);

  for (var i = 0; i < label.length; i++)
    width += fm.charWidth(label, i);
  return width;
}

GraphFrame.prototype.resizeEvent = function(ev)
{
  this.maxPoints = ev.size().width() - this.scaleWidth;
  this.maxPoints /= SCROLL_STEP;
  this.resize(this.parentWidget().size.width(), this.parentWidget().size.height());
}

GraphFrame.prototype.paintEvent = function(ev)
{
  this.painter.begin(this);

  /** Filling */
  this.painter.setRenderHint(QPainter.Antialiasing);
  this.painter.setRenderHint(QPainter.TextAntialiasing);

  /* Fill in the background */
  this.painter.fillRect(this.frameRect, BACK_COLOR);

  /** Paint Scale */
  var label = new Array();
  var width = new Array();
  var top = this.frameRect.y();
  var bottom = this.frameRect.height();
  var scaleWidth = 0;
  var pos = 0;
  var markStep = this.maxValue * 0.25;
  var paintStep = (bottom - (bottom/8)) / 4;

  /* Compute each of the y-axis labels */
  for (var i = 0; i < 4; i++) {
   pos = bottom - ((i+1) * paintStep);
   label[i] = (markStep*(i+1)).toFixed(2).toString() + "KB/s";
   width[i] = this.labelWidth(label[i]);
   scaleWidth = Math.max(scaleWidth, 2+width[i]);
  }

  /* Include a 5px margin between the y-axis and its labels */
  this.scaleWidth = scaleWidth + 5;

  /* Draw the y-axis labels and horizontal marks in their correctly scaled
   * locations */
  for (i = 0; i < 4; i++) {
    pos = bottom - ((i+1) * paintStep);
    this.painter.setPen(SCALE_COLOR);
    this.painter.drawText(new QPointF(this.scaleWidth-width[i]-5, pos), String(label[i]));

    this.painter.setPen(GRID_COLOR);
    this.painter.drawLine(new QPointF(this.scaleWidth, pos),
                          new QPointF(this.frameRect.width(), pos));
  }

  /* Draw the y-axis */
  this.painter.drawLine(this.scaleWidth, top, this.scaleWidth, bottom);

  /**********************************************
   * Paint data *********************************/
  var recvPoints = [];
  var sendPoints = [];

  /* Convert the bandwidth data points to graph points */
  recvPoints = this.pointsFromData(this.recvData);
  sendPoints = this.pointsFromData(this.sendData);

  if (this.graphStyle == AreaGraph) {
    /* Plot the bandwidth data as area graphs */
    if (this.showRecv)
    {
      var oldBrush = this.painter.brush();
      RECV_COLOR.setAlphaF(0.6);
      this.painter.setBrush(new QBrush(RECV_COLOR));
      this.painter.drawPolygon(new QPolygonF(recvPoints), Qt.OddEvenFill);
      this.painter.setBrush(oldBrush);
    }
    if (this.showSend)
    {
      var oldBrush = this.painter.brush();
      SEND_COLOR.setAlphaF(0.4);
      this.painter.setBrush(new QBrush(SEND_COLOR));
      this.painter.drawPolygon(new QPolygonF(sendPoints), Qt.OddEvenFill);
      this.painter.setBrush(oldBrush);
    }
  }

  /* Plot the bandwidth as solid lines. If the graph style is currently an
   * area graph, we end up outlining the integrals. */
  if (this.showRecv)
  {
    var oldPen = this.painter.pen();
    this.painter.setPen(RECV_COLOR);
    this.painter.drawPolyline(new QPolygonF(recvPoints));
    this.painter.setPen(oldPen);
  }
  if (this.showSend)
  {
    var oldPen = this.painter.pen();
    this.painter.setPen(SEND_COLOR);
    this.painter.drawPolyline(new QPolygonF(sendPoints));
    this.painter.setPen(oldPen);
  }

  /************************************************
   * Paint totals *********************************/
  var x = this.scaleWidth + FONT_SIZE;
  var y = 0;
  var rowHeight = FONT_SIZE;

  /* On Mac, we don't need vertical spacing between the text rows. */
  // TODO: see how to use this in this case since we don't have preproc
  rowHeight += 5;

  /* If total received is selected */
  if (this.showRecv) {
    y = rowHeight;
    this.painter.setPen(RECV_COLOR);
    var total = Math.floor(this.totalRecv*100) / 100;
    var count = Math.floor(this.recvData[0]*100) / 100;
    this.painter.drawText(new QPoint(x, y),
        tr("Recv:") + " " + total +
        " (" + count + "KB/s)");
  }

  /* If total sent is selected */
  if (this.showSend) {
    y += rowHeight;
    this.painter.setPen(SEND_COLOR);
    var total = Math.floor(this.totalSend*100) / 100;
    var count = Math.floor(this.sendData[0]*100) / 100;
    this.painter.drawText(new QPoint(x, y),
        tr("Sent:") + " " + total +
        " (" + count + "KB/s)");
  }
  this.painter.end();
}
