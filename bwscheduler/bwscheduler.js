importExtension("qt");
importExtension("qt.core");
importExtension("qt.gui");
importExtension("qt.uitools");
importExtension("qt.network");

var bwscheduler = {
    SETTING_ENABLED: "BandwidthSchedulerEnabled",

    weekDays : ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],

    start: function() {
        vdebug("BandwidthScheduler@start");

        var configPath = pluginPath + "/bwscheduler/config.ini";
        this.settings = new QSettings(configPath, QSettings.NativeFormat);

        this.timer = new QTimer();
        this.timer['timeout()'].connect(this, this.updateRate);
        this.timer.start(60000);
    },

    updateRate: function() {
        if (this.settings.value(this.SETTING_ENABLED) == "true") {
            torrc.clear(["BandwidthRate", "BandwidthBurst"]);

            var currentTime = QTime.currentTime();
            var today = new Date()

            var size = this.settings.beginReadArray("schedules");

            for (var i = 0; i < size; i++) {
                this.settings.setArrayIndex(i);
                var day = this.settings.value("cmbDay");
                var startTime = QTime.fromString(this.settings.value("timeStart"), "hh:mm");
                var endTime = QTime.fromString(this.settings.value("timeEnd"), "hh:mm");
                var bwRate = this.settings.value("spinRate");
                var bwUnit = this.settings.value("cmbUnit");

                if (startTime <= currentTime && currentTime <= endTime) {
                    if (day == "Everyday") {
                        torrc.setValue("BandwidthRate" , bwRate + " " + bwUnit);
                        torrc.setValue("BandwidthBurst" , bwRate + " " + bwUnit);
                    }
                    else if (day == this.weekDays[today.getDay()]) {
                        torrc.setValue("BandwidthRate" , bwRate + " " + bwUnit);
                        torrc.setValue("BandwidthBurst" , bwRate + " " + bwUnit);
                    }
                }
            }

            this.settings.endArray();
            torrc.apply(torControl);
        }
    },

    updateList: function() {
        try{
            for (var i = 0; i < this.customwidget.length; i++) {
                this.customwidget[i].hide();
                this.listLayout.removeWidget(this.customwidget[i]);
            }
        }
        catch(err){}

        this.customwidget = new Array();
        this.grpBox = new Array();
        this.cmbDay = new Array();
        this.timeStart = new Array();
        this.timeEnd = new Array();
        this.spinRate = new Array();
        this.cmbUnit = new Array();
        this.chkRemove = new Array();
        this.lineError = new Array();

        this.listLayout = this.scrollArea.widget().layout();
        while(this.listLayout.count() > 1) this.listLayout.takeAt(0);

        var loader = new QUiLoader(this.containerWidget);

        var size = this.settings.beginReadArray("schedules");

        for (var i = 0; i < size; i++) {
            this.customwidget[i] = loader.load(new QFile(pluginPath + "/bwscheduler/schedulerwidget.ui"));
            this.grpBox[i] = this.customwidget[i].children()[findWidget(this.customwidget[i], "groupBox")];
            this.cmbDay[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "cmbDay")];
            this.timeStart[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "timeStart")];
            this.timeEnd[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "timeEnd")];
            this.spinRate[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "spinRate")];
            this.cmbUnit[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "cmbUnit")];
            this.chkRemove[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "chkRemove")];
            this.lineError[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "lineError")];
            this.fillDays(this.cmbDay[i]);

            this.settings.setArrayIndex(i);
            this.cmbDay[i].setCurrentIndex(this.cmbDay[i].findText(this.settings.value("cmbDay")));
            this.timeStart[i].time = QTime.fromString(this.settings.value("timeStart"), "hh:mm");
            this.timeEnd[i].time = QTime.fromString(this.settings.value("timeEnd"), "hh:mm");
            this.spinRate[i].value = this.settings.value("spinRate");
            this.cmbUnit[i].setCurrentIndex(this.cmbUnit[i].findText(this.settings.value("cmbUnit")));

            this.cmbDay[i]['currentIndexChanged(int)'].connect(this, this.enableApply);
            this.timeStart[i]['timeChanged(QTime)'].connect(this, this.enableApply);
            this.timeEnd[i]['timeChanged(QTime)'].connect(this, this.enableApply);
            this.spinRate[i]['valueChanged(int)'].connect(this, this.enableApply);
            this.cmbUnit[i]['currentIndexChanged(int)'].connect(this, this.enableApply);
            this.chkRemove[i]['stateChanged(int)'].connect(this, this.enableRemove);

            this.listLayout.insertWidget(0, this.customwidget[i], 0, 0);
        }

        this.settings.endArray();

        this.btnApply.enabled = false;
        this.btnDiscard.enabled = false;
    },

    applyServices: function() {
        this.settings.remove("schedules");
        this.settings.beginWriteArray("schedules");
        for (var i = 0; i < this.customwidget.length; i++) {
            this.settings.setArrayIndex(i);
            this.settings.setValue("cmbDay", this.cmbDay[i].currentText);
            this.settings.setValue("timeStart", this.timeStart[i].time.toString("hh:mm"));
            this.settings.setValue("timeEnd", this.timeEnd[i].time.toString("hh:mm"));
            this.settings.setValue("spinRate", this.spinRate[i].value);
            this.settings.setValue("cmbUnit", this.cmbUnit[i].currentText);
        }
        this.settings.endArray();

        this.updateList();
        this.btnApply.enabled = false;
        this.btnDiscard.enabled = false;
    },

    removeServices: function() {
        this.settings.remove("schedules");
        this.settings.beginWriteArray("schedules");
        var pos = 0;
        for (var i = 0; i < this.customwidget.length; i++) {
            if (this.chkRemove[i].checkState() == Qt.Unchecked) {
                this.settings.setArrayIndex(pos);
                this.settings.setValue("cmbDay", this.cmbDay[i].currentText);
                this.settings.setValue("timeStart", this.timeStart[i].time.toString("hh:mm"));
                this.settings.setValue("timeEnd", this.timeEnd[i].time.toString("hh:mm"));
                this.settings.setValue("spinRate", this.spinRate[i].value);
                this.settings.setValue("cmbUnit", this.cmbUnit[i].currentText);
                pos++;
            }
        }
        this.settings.endArray();

        this.updateList();
        this.btnRemove.enabled = false;
    },

    enableApply: function() {
        this.btnDiscard.enabled = true;
        if (this.sanityCheck())
            this.btnApply.enabled = true;
        else
            this.btnApply.enabled = false;
    },

    sanityCheck: function() {
        for (var i = 0; i < this.customwidget.length; i++) {
            if (this.timeStart[i].time > this.timeEnd[i].time) {
                this.lineError[i].setText("Start Time must be lesser than End Time");
                this.lineError[i].show();
                return false;
            }
            if (this.cmbUnit[i].currentText == "KB") {
                if (this.spinRate[i].value > 0 && this.spinRate[i].value < 25) {
                    this.lineError[i].setText("Bandwidth Rate must be atleast 25 KB");
                    this.lineError[i].show();
                    return false;
                }
            }
        }

        return true;
    },

    enableRemove: function() {
        this.btnRemove.enabled = false;
        for (var i = 0; i < this.customwidget.length; i++) {
            if (this.chkRemove[i].checkState() == Qt.Checked) {
                this.btnRemove.enabled = true;
                break;
            }
        }
    },

    addService: function() {
        var loader = new QUiLoader(this.containerWidget);
        this.customwidget.push(loader.load(new QFile(pluginPath + "/bwscheduler/schedulerwidget.ui")));
        var pos = this.customwidget.length-1;

        this.grpBox[pos] = this.customwidget[pos].children()[findWidget(this.customwidget[pos], "groupBox")];
        this.cmbDay[pos] = this.grpBox[pos].children()[findWidget(this.grpBox[pos], "cmbDay")];
        this.timeStart[pos] = this.grpBox[pos].children()[findWidget(this.grpBox[pos], "timeStart")];
        this.timeEnd[pos] = this.grpBox[pos].children()[findWidget(this.grpBox[pos], "timeEnd")];
        this.spinRate[pos] = this.grpBox[pos].children()[findWidget(this.grpBox[pos], "spinRate")];
        this.cmbUnit[pos] = this.grpBox[pos].children()[findWidget(this.grpBox[pos], "cmbUnit")];
        this.chkRemove[pos] = this.grpBox[pos].children()[findWidget(this.grpBox[pos], "chkRemove")];
        this.lineError[pos] = this.grpBox[pos].children()[findWidget(this.grpBox[pos], "lineError")];
        this.fillDays(this.cmbDay[pos]);

        this.cmbDay[pos]['currentIndexChanged(int)'].connect(this, this.enableApply);
        this.timeStart[pos]['timeChanged(QTime)'].connect(this, this.enableApply);
        this.timeEnd[pos]['timeChanged(QTime)'].connect(this, this.enableApply);
        this.spinRate[pos]['valueChanged(int)'].connect(this, this.enableApply);
        this.chkRemove[pos]['stateChanged(int)'].connect(this, this.enableRemove);

        this.listLayout.insertWidget(0, this.customwidget[pos], 0, 0);
    },

    fillDays: function(cmbDay) {
        cmbDay.addItem("Everyday");
        cmbDay.addItem("Sunday", Qt.Sunday);
        cmbDay.addItem("Monday", Qt.Monday);
        cmbDay.addItem("Tuesday", Qt.Tuesday);
        cmbDay.addItem("Wednesday", Qt.Wednesday);
        cmbDay.addItem("Thursday", Qt.Thursday);
        cmbDay.addItem("Friday", Qt.Friday);
        cmbDay.addItem("Saturday", Qt.Saturday);
    },

    buildGUI: function() {
        vdebug("BandwidthScheduler@buildGUI");

        this.tab = new VidaliaTab("Bandwidth Scheduler", "BandwidthScheduler");

        var containerui = new QFile(pluginPath + "/bwscheduler/bwscheduler.ui");
        var loader = new QUiLoader(this.tab);
        containerui.open(QIODevice.ReadOnly);

        this.containerwidget = loader.load(containerui);

        var layout = new QVBoxLayout();
        layout.addWidget(this.containerwidget, 0, Qt.AlignCenter);
        this.tab.setLayout(layout);

        this.scrollArea = this.containerwidget.children()[findWidget(this.containerwidget, "scrollArea")];
        if (this.scrollArea == null)
            return this.tab;

        this.chkEnabled = this.containerwidget.children()[findWidget(this.containerwidget, "chkEnabled")];
        if (this.chkEnabled == null)
            return this.tab;

        this.btnAdd = this.containerwidget.children()[findWidget(this.containerwidget, "btnAdd")];
        if (this.btnAdd == null)
            return this.tab;

        this.btnRemove = this.containerwidget.children()[findWidget(this.containerwidget, "btnRemove")];
        if (this.btnRemove == null)
            return this.tab;

        this.btnApply = this.containerwidget.children()[findWidget(this.containerwidget, "btnApply")];
        if (this.btnApply == null)
            return this.tab;

        this.btnDiscard = this.containerwidget.children()[findWidget(this.containerwidget, "btnDiscard")];
        if (this.btnDiscard == null)
            return this.tab;

        this.chkEnabled['stateChanged(int)'].connect(this, this.toggleEnabled);
        this.btnAdd['clicked()'].connect(this, this.addService);
        this.btnRemove['clicked()'].connect(this, this.removeServices);
        this.btnApply['clicked()'].connect(this, this.applyServices);
        this.btnDiscard['clicked()'].connect(this, this.updateList);

        this.chkEnabled.setCheckState((this.settings.value(this.SETTING_ENABLED, "false") == "true")?Qt.Checked:Qt.Unchecked);

        this.updateList();

        return this.tab;
    },

    toggleEnabled: function() {
        var enableScheduler = (this.chkEnabled.checkState() == Qt.Checked) ? true : false;
        this.settings.setValue(this.SETTING_ENABLED, enableScheduler.toString());
        this.scrollArea.setEnabled(enableScheduler);
        this.btnAdd.setEnabled(enableScheduler);

        if (! enableScheduler) {
            torrc.clear(["BandwidthRate", "BandwidthBurst"]);
            torrc.apply(torControl);
        }
    },

    stop: function() {
        vdebug("Tutorial@stop");
    },
};
