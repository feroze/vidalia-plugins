importExtension("qt");
importExtension("qt.core");
importExtension("qt.gui");
importExtension("qt.uitools");
importExtension("qt.network");

var hiddenservice = {
    removeServices: function() {
        torrc.clear(["HiddenServiceDir", "HiddenServicePort"]);

        for(i = 0; i < this.customwidget.length; i++) {
            if (this.chkBox[i].checkState() == Qt.Unchecked) {
            torrc.setValue("HiddenServiceDir", this.hidservdir[i]);
            torrc.setValue("HiddenServicePort", this.hidservport[i]);
            }
        }

        torrc.apply(torControl);

        this.updateList();
        this.btnRemove.enabled = false;
    },

    updateList: function() {

        try{
            for(i = 0; i < this.customwidget.length; i++) {
                this.customwidget[i].hide();
                this.listLayout.removeWidget(this.customwidget[i]);
            }
        }
        catch(err){}

        this.hidservdir = torrc.value("HiddenServiceDir");
        this.hidservport = torrc.value("HiddenServicePort");

        this.customwidget = new Array();
        this.grpBox = new Array();
        this.lineDir = new Array();
        this.spinPort = new Array();
        this.lineAddress = new Array();
        this.lineName = new Array();
        this.chkBox = new Array();
        this.btnBrowse = new Array();

        this.address = new QHostAddress();

        this.listLayout = this.scrollArea.widget().layout();
        while(this.listLayout.count() > 1) this.listLayout.takeAt(0);

        var loader = new QUiLoader(this.containerWidget);

        for(i = 0; i< this.hidservdir.length; i++) {
            this.customwidget[i] = loader.load(new QFile(pluginPath + "/hiddenservice/customWidget.ui"));
            this.grpBox[i] = this.customwidget[i].children()[findWidget(this.customwidget[i], "groupBox")];
            this.lineDir[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "lineDir")];
            this.spinPort[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "spinPort")];
            this.lineAddress[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "lineAddress")];
            this.lineName[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "lineName")];
            this.chkBox[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "checkBox")];
            this.btnBrowse[i] = this.grpBox[i].children()[findWidget(this.grpBox[i], "btnBrowse")];

            var file = new QFile(this.hidservdir[i] + "/hostname");
            if(file.open(QIODevice.ReadOnly))
            {
                var textStream = new QTextStream(file);
                this.lineName[i].setText(textStream.readLine());
            }

            this.lineDir[i].setText(this.hidservdir[i]);
            this.spinPort[i].value = this.hidservport[i].split(" ")[0];
            if (this.hidservport[i].split(" ")[1])
                this.lineAddress[i].setText(this.hidservport[i].split(" ")[1]);
            else
                this.lineAddress[i].setText("127.0.0.1");

            this.chkBox[i]['stateChanged(int)'].connect(this, this.enableRemove);
            this.lineDir[i]['textEdited(QString)'].connect(this, this.enableApply);
            this.spinPort[i]['valueChanged(int)'].connect(this, this.enableApply);
            this.lineAddress[i]['textEdited(QString)'].connect(this, this.enableApply);
            this.btnBrowse[i]['clicked()'].connect(this, this.browseDir);

            this.listLayout.insertWidget(0, this.customwidget[i], 0, 0);
        }

        this.btnApply.enabled = false;
        this.btnDiscard.enabled = false;
    },

    browseDir: function() {
        QFileDialog.getExistingDirectory(this, "Browse Directory", "/home");
    },

    applyServices: function() {
        torrc.clear(["HiddenServiceDir", "HiddenServicePort"]);

        for(i = this.customwidget.length-1; i >= 0; i--) {
            torrc.setValue("HiddenServiceDir", this.lineDir[i].text);
            torrc.setValue("HiddenServicePort", this.spinPort[i].value + " " + this.lineAddress[i].text);
        }

        torrc.apply(torControl);

        this.updateList();
        this.btnApply.enabled = false;
        this.btnDiscard.enabled = false;
    },

    enableApply: function() {
        this.btnDiscard.enabled = true;
        if(this.sanityCheck()) 
            this.btnApply.enabled = true;
        else
            this.btnApply.enabled = false;
    },

    sanityCheck: function() {
        for(i = 0; i < this.customwidget.length; i++) {
            var ip = this.lineAddress[i].text.split(":");
            var port = this.spinPort[i].value;

            if(! this.address.setAddress(ip[0]))
                return false;
            if(port < 1 || port >65535)
                return false;
            if(ip[1] < 1 || ip[1] > 65535)
                return false;
        }

            return true;
    },

    enableRemove: function() {
        this.btnRemove.enabled = false;
        for (i = 0; i < this.hidservdir.length; i++) {
            if(this.chkBox[i].checkState() == Qt.Checked) {
                this.btnRemove.enabled = true;
                break;
            }
        }
    },

    addService: function() {

        var loader = new QUiLoader(this.containerWidget);
        this.customwidget.push(loader.load(new QFile(pluginPath + "/hiddenservice/customWidget.ui")));
        var pos = this.customwidget.length-1;

        this.grpBox[pos] = this.customwidget[pos].children()[findWidget(this.customwidget[pos], "groupBox")];
        this.lineDir[pos] = this.grpBox[pos].children()[findWidget(this.grpBox[pos], "lineDir")];
        this.spinPort[pos] = this.grpBox[pos].children()[findWidget(this.grpBox[pos], "spinPort")];
        this.lineAddress[pos] = this.grpBox[i].children()[findWidget(this.grpBox[pos], "lineAddress")];
        this.lineName[pos] = this.grpBox[pos].children()[findWidget(this.grpBox[pos], "lineName")];
        this.chkBox[pos] = this.grpBox[pos].children()[findWidget(this.grpBox[pos], "checkBox")];

        this.chkBox[pos]['stateChanged(int)'].connect(this, this.enableRemove);
        this.lineDir[pos]['textEdited(QString)'].connect(this, this.enableApply);
        this.spinPort[pos]['valueChanged(int)'].connect(this, this.enableApply);
        this.lineAddress[pos]['textEdited(QString)'].connect(this, this.enableApply);

        this.listLayout.insertWidget(0, this.customwidget[this.customwidget.length-1], 0, 0);
    },


    start: function() {
        vdebug("HiddenService@start");
    },

    buildGUI: function() {
        vdebug("HiddenService@buildGUI");

        this.tab = new VidaliaTab("Configure hidden services", "HiddenService");

        var containerui = new QFile(pluginPath + "/hiddenservice/containerWidget.ui");
        var loader = new QUiLoader(this.tab);
        containerui.open(QIODevice.ReadOnly);

        this.containerwidget = loader.load(containerui);

        var layout = new QVBoxLayout();
        layout.addWidget(this.containerwidget, 0, Qt.AlignCenter);
        this.tab.setLayout(layout);

        this.scrollArea = this.containerwidget.children()[findWidget(this.containerwidget, "scrollArea")];
        if(this.scrollArea == null)
            return this.tab;

        this.btnAdd = this.containerwidget.children()[findWidget(this.containerwidget, "btnAdd")];
        if(this.btnAdd == null)
            return this.tab;

        this.btnRemove = this.containerwidget.children()[findWidget(this.containerwidget, "btnRemove")];
        if(this.btnRemove == null)
            return this.tab;

        this.btnApply = this.containerwidget.children()[findWidget(this.containerwidget, "btnApply")];
        if(this.btnApply == null)
            return this.tab;

        this.btnDiscard = this.containerwidget.children()[findWidget(this.containerwidget, "btnDiscard")];
        if(this.btnDiscard == null)
            return this.tab;

        this.updateList();

        this.btnRemove['clicked()'].connect(this, this.removeServices);
        this.btnAdd['clicked()'].connect(this, this.addService);
        this.btnApply['clicked()'].connect(this, this.applyServices);
        this.btnDiscard['clicked()'].connect(this, this.updateList);

        containerui.close();

        return this.tab;
    },

    stop: function() {
        vdebug("Tutorial@stop");
    },
};
