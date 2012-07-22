importExtension("qt");
importExtension("qt.core");
importExtension("qt.gui");
importExtension("qt.uitools");

var bwgraph = {
    From: "From",
    Sent: "Sent",
    Recv: "Recv",

    SETTING_DORECV: "DoRecv",
    SETTING_DOSEND: "DoSend",
    SETTING_ALWAYS_ON_TOP: "AlwaysOnTop",
    SETTING_STYLE: "GraphStyle",

    start: function() {
        vdebug("Bwhistory@start");
        this.createGUI();
        this.loadSettings();

        this.recv = parseInt(this.tab.getSetting(this.Sent, 0));
        this.sent = parseInt(this.tab.getSetting(this.Recv, 0));
        this.from = this.tab.getSetting(this.From, "");
        torControl.setEvent(TorEvents.Bandwidth);

        if(this.from.length == 0)
            this.from = QDateTime.currentDateTime().toString();
        torControl["bandwidthUpdate(quint64, quint64)"].connect(this, this.saveBandwidth);
    },

    saveBandwidth: function(recv, sent) {
        this.recv += recv;
        this.sent += sent;

        this.tab.saveSetting(this.Recv, this.recv.toString());
        this.tab.saveSetting(this.Sent, this.sent.toString());
        this.tab.saveSetting(this.From, this.from);

        this.lblFrom.text = this.from;
        this.lblSent.text = (this.sent/1024/1024).toFixed(4).toString() + " <b>Mb/s</b>";
        this.lblRecv.text = (this.recv/1024/1024).toFixed(4).toString() + " <b>Mb/s</b>";
        this.frame.addPoints(recv/1024.0, sent/1024.0);
    },

    resetCounters: function() {
        this.recv = 0;
        this.sent = 0;
        this.from = QDateTime.currentDateTime().toString();
        this.saveBandwidth(0,0);
    },

    createGUI: function() {
        this.tab = new VidaliaTab("Bandwidth Graph", "BandwidthGraph");

        var file = new QFile(pluginPath+"/bwgraph/bwgraph.ui");
        var loader = new QUiLoader(this.tab);
        file.open(QIODevice.ReadOnly);
        this.widget = loader.load(file);
        var layout = new QVBoxLayout(this.tab);
        layout.sizeConstraint = QLayout.SetMinAndMaxSize;
        layout.addWidget(this.widget, 100, Qt.AlignCenter);
        this.tab.setLayout(layout);
        file.close();

        this.grpBandwidth = this.widget.children()[findWidget(this.widget, "grpBandwidth")];

        var graphFrame = this.widget.children()[findWidget(this.widget, "graphFrame")];
        var graphLayout = graphFrame.children()[findWidget(graphFrame, "graphLayout")];

        this.frame = new GraphFrame();
        graphLayout.addWidget(this.frame, 1000, Qt.AlignLeft);

        this.btnHistory = this.widget.children()[findWidget(this.widget, "btnHistory")];
        this.btnSettings = this.widget.children()[findWidget(this.widget, "btnSettings")];
        this.btnReset = this.widget.children()[findWidget(this.widget, "btnReset")];

        this.frmSettings = this.widget.children()[findWidget(this.widget, "frmSettings")];
        this.btnSaveSettings = this.frmSettings.children()[findWidget(this.frmSettings, "btnSaveSettings")];
        this.btnCancelSettings = this.frmSettings.children()[findWidget(this.frmSettings, "btnCancelSettings")];
        this.cmbGraphStyle = this.frmSettings.children()[findWidget(this.frmSettings, "cmbGraphStyle")];
        this.chkReceiveRate = this.frmSettings.children()[findWidget(this.frmSettings, "chkReceiveRate")];
        this.chkSendRate = this.frmSettings.children()[findWidget(this.frmSettings, "chkSendRate")];
        this.chkAlwaysOnTop = this.frmSettings.children()[findWidget(this.frmSettings, "chkAlwaysOnTop")];

        this.lblFrom = this.grpBandwidth.children()[findWidget(this.grpBandwidth, "lblFrom")];
        this.lblSent = this.grpBandwidth.children()[findWidget(this.grpBandwidth, "lblSent")];
        this.lblRecv = this.grpBandwidth.children()[findWidget(this.grpBandwidth, "lblRecv")];
        this.btnResetHistory = this.grpBandwidth.children()[findWidget(this.grpBandwidth, "btnResetHistory")];

        this.lblFrom.text = this.from;
        this.lblSent.text = (this.sent/1024/1024).toFixed(4).toString() + " <b>Mb/s</b>";
        this.lblRecv.text = (this.recv/1024/1024).toFixed(4).toString() + " <b>Mb/s</b>";

        this.btnResetHistory["clicked()"].connect(this, this.resetCounters);

        this.btnHistory["toggled(bool)"].connect(this, this.toggleHistory);
        this.btnSettings["toggled(bool)"].connect(this, this.toggleSettings);
        this.toggleHistory(false);
        this.toggleSettings(false);

        this.btnReset["clicked()"].connect(this.frame, this.frame.resetGraph);
        this.btnSaveSettings["clicked()"].connect(this, this.saveSettings);
    },

    saveSettings: function() {
        vdebug("Bwhistory@saveSettings");
        this.tab.saveSetting(this.SETTING_DORECV, (this.chkReceiveRate.checkState() == Qt.Checked) ? "true" : "false");
        this.tab.saveSetting(this.SETTING_DOSEND, (this.chkSendRate.checkState() == Qt.Checked) ? "true" : "false");
        this.tab.saveSetting(this.SETTING_STYLE, this.cmbGraphStyle.currentIndex);
        this.tab.saveSetting(this.SETTING_ALWAYS_ON_TOP, (this.chkAlwaysOnTop.checkState() == Qt.Checked) ? "true" : "false");
        this.frame.graphStyle = this.cmbGraphStyle.currentIndex;
        this.frame.showRecv = (this.chkReceiveRate.checkState() == Qt.Checked);
        this.frame.showSend = (this.chkSendRate.checkState() == Qt.Checked);
        this.toggleSettings(false);
        if(this.chkAlwaysOnTop.checkState() == Qt.Checked)
        {
          this.tab.setWindowFlags(Qt.WindowFlags(this.tab.windowFlags() ^ Qt.WindowStaysOnTopHint));
          if(this.tab.visible)
          {
            this.tab.show();
            this.tab.activateWindow();
          }
        }
    },

    loadSettings: function() {
        vdebug("Bwhistory@loadSettings");
        var dorecv = this.tab.getSetting(this.SETTING_DORECV, "true") != "false";
        var dosend = this.tab.getSetting(this.SETTING_DOSEND, "true") != "false";
        this.frame.graphStyle = this.tab.getSetting(this.SETTING_STYLE, 0);
        var alwaysontop = this.tab.getSetting(this.SETTING_ALWAYS_ON_TOP, "false") != "false";

        this.chkReceiveRate.setCheckState(dorecv ? Qt.Checked : Qt.Unchecked);
        this.chkSendRate.setCheckState(dosend ? Qt.Checked : Qt.Unchecked);
        this.chkAlwaysOnTop.setCheckState(alwaysontop ? Qt.Checked : Qt.Unchecked);
        this.cmbGraphStyle.currentIndex = this.frame.graphStyle;
        this.frame.showRecv = dorecv;
        this.frame.showSend = dosend;
        if(this.chkAlwaysOnTop.checkState() == Qt.Checked)
        {
          this.tab.setWindowFlags(Qt.WindowFlags(this.tab.windowFlags() ^ Qt.WindowStaysOnTopHint));
          if(this.tab.visible)
          {
            this.tab.show();
            this.tab.activateWindow();
          }
        }
    },

    buildGUI: function() {
        vdebug("Bwhistory@buildGUI");
        return this.tab;
    },

    toggleHistory: function(toggle) {
      this.grpBandwidth.setVisible(toggle);
      this.btnHistory.checked = toggle;
    },

    toggleSettings: function(toggle) {
      this.frmSettings.setVisible(toggle);
      this.btnSettings.checked = toggle;
    },

    stop: function() {
        vdebug("Bwhistory@stop");
        this.saveBandwidth(0,0);
    },
};
