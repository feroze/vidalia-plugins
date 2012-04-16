importExtension("qt");
importExtension("qt.core");
importExtension("qt.gui");
importExtension("qt.uitools");

var tutorial = {
    start: function() {
		    vdebug("Tutorial@start");
        torControl["bandwidthUpdate(quint64, quint64)"].connect(this, this.saveBandwidth);
    },

    saveBandwidth: function(recv, sent) {
        vdebug("Tutorial::Recv", recv);
        vdebug("Totorial::Sent", sent);
    },

    buildGUI: function() {
        vdebug("Tutorial@buildGUI");
        // Load the GUI file
        this.tab = new VidaliaTab("Display bandwidth history", "BandwidthHistory");

        var file = new QFile(pluginPath+"/tutorial/tutorial.ui");
        var loader = new QUiLoader(this.tab);
        file.open(QIODevice.ReadOnly);
        this.widget = loader.load(file);
        var layout = new QVBoxLayout();
        layout.addWidget(this.widget, 0, Qt.AlignCenter);
        this.tab.setLayout(layout);
        file.close();

        var groupBox = this.widget.children()[findWidget(this.widget, "browserBox")];
        if(groupBox == null) {
            return this.tab;
        }

        this.btnSave = this.widget.children()[findWidget(this.widget, "btnSave")];
        if(this.btnSave != null) {
            this.btnSave["clicked()"].connect(this, this.saveSettings);
        }

        this.btnLaunch = groupBox.children()[findWidget(groupBox, "btnLaunch")];
        if(this.btnLaunch != null) {
            this.btnLaunch["clicked()"].connect(this, this.startSubProcess);
        }

        return this.tab;
    },

    stop: function() {
        vdebug("Tutorial@stop");
    },
};
