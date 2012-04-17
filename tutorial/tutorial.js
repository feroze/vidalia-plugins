importExtension("qt");
importExtension("qt.core");
importExtension("qt.gui");
importExtension("qt.uitools");

var tutorial = {
    From: "From",
    Sent: "Sent",
    Recv: "Recv",

    start: function() {
		    vdebug("Tutorial@start");
        torControl["bandwidthUpdate(quint64, quint64)"].connect(this, this.saveBandwidth);
        this.tab = new VidaliaTab("Display bandwidth history", "BandwidthHistory");

        this.recv = parseInt(this.tab.getSetting(this.Sent, 0));
        this.sent = parseInt(this.tab.getSetting(this.Recv, 0));
        this.from = this.tab.getSetting(this.From, "");

        if(this.from.length == 0)
            this.from = QDateTime.currentDateTime().toString();

        // null labels so that we don't update them until the GUI is created
        this.lblFrom = null;
        this.lblSent = null;
        this.lblRecv = null;
    },

    saveBandwidth: function(recv, sent) {
        vdebug("Tutorial::Recv", recv);
        vdebug("Totorial::Sent", sent);

        this.recv += recv;
        this.sent += sent;
        this.tab.saveSetting(this.Recv, this.recv);
        this.tab.saveSetting(this.Sent, this.sent);
        this.tab.saveSetting(this.From, this.from);

        if(this.lblFrom)
            this.lblFrom.text = this.from;
        if(this.lblSent)
            this.lblSent.text = this.sent.toString();
        if(this.lblRecv)
            this.lblRecv.text = this.recv.toString();
    },

    resetCounters: function() {
        this.recv = 0;
        this.sent = 0;
        this.from = QDateTime.currentDateTime().toString();
        this.saveBandwidth(0,0);
    },

    buildGUI: function() {
        vdebug("Tutorial@buildGUI");
        // Load the GUI file

        if(this.tab)
            delete this.tab;

        this.tab = new VidaliaTab("Display bandwidth history", "BandwidthHistory");

        var file = new QFile(pluginPath+"/tutorial/tutorial.ui");
        var loader = new QUiLoader(this.tab);
        file.open(QIODevice.ReadOnly);
        this.widget = loader.load(file);
        var layout = new QVBoxLayout();
        layout.addWidget(this.widget, 0, Qt.AlignCenter);
        this.tab.setLayout(layout);
        file.close();

        var grpBandwidth = this.widget.children()[findWidget(this.widget, "grpBandwidth")];
        if(grpBandwidth == null)
            return this.tab;

        this.lblFrom = grpBandwidth.children()[findWidget(grpBandwidth, "lblFrom")];
        if(this.lblFrom == null)
            return this.tab;

        this.lblSent = grpBandwidth.children()[findWidget(grpBandwidth, "lblSent")];
        if(this.lblSent == null)
            return this.tab;

        this.lblRecv = grpBandwidth.children()[findWidget(grpBandwidth, "lblRecv")];
        if(this.lblRecv == null)
            return this.tab;

        this.btnReset = grpBandwidth.children()[findWidget(grpBandwidth, "btnReset")];
        if(this.btnReset == null)
            return this.tab;

        this.lblFrom.text = this.from;
        this.lblSent.text = this.sent.toString();
        this.lblRecv.text = this.recv.toString();

        this.btnReset["clicked()"].connect(this, this.resetCounters);

        return this.tab;
    },

    stop: function() {
        vdebug("Tutorial@stop");
        this.saveBandwidth(0,0);
    },
};
