importExtension("qt");
importExtension("qt.core");
importExtension("qt.gui");
importExtension("qt.uitools");
importExtension("qt.network");

var hiddenservice = {
    removeServices: function() {
        torrc.clear(["HiddenServiceDir", "HiddenServicePort"]);

        for(var i = 0; i < this.customwidget.length; i++) {
            if (this.customwidget[i].checked() == false) {
                torrc.setValue("HiddenServiceDir", this.hidservdir[i]);
                torrc.setValue("HiddenServicePort", this.hidservport[i]);
            }

            else {
                this.customwidget[i].hide();
                this.listLayout.removeWidget(this.customwidget[i]);
            }
        }

        torrc.apply(torControl);

        this.btnRemove.enabled = false;
    },

    updateList: function() {
        try{
            for(var i = 0; i < this.customwidget.length; i++) {
                this.customwidget[i].hide();
                this.listLayout.removeWidget(this.customwidget[i]);
            }
        }
        catch(err){}

        this.hidservdir = torrc.value("HiddenServiceDir");
        this.hidservport = torrc.value("HiddenServicePort");

        this.customwidget = new Array();

        this.listLayout = this.scrollArea.widget().layout();
        while(this.listLayout.count() > 1) this.listLayout.takeAt(0);

        var loader = new QUiLoader(this.containerWidget);

        for(var i = 0; i< this.hidservdir.length; i++) {
            this.customwidget[i] = new HSWidget(i, this);
            this.customwidget[i].setParent(this);
            this.listLayout.insertWidget(0, this.customwidget[i], 0, 0);
        }

        this.btnApply.enabled = false;
        this.btnDiscard.enabled = false;
    },


    applyServices: function() {
        torrc.clear(["HiddenServiceDir", "HiddenServicePort"]);

        for(var i = this.customwidget.length-1; i >= 0; i--) {
            this.customwidget[i].apply();
        }

        torrc.apply(torControl);

        this.updateList();
    },

    toggleApply: function() {
        this.btnDiscard.enabled = true;
        if(this.sanityCheck())
            this.btnApply.enabled = true;
        else
            this.btnApply.enabled = false;
    },

    sanityCheck: function() {
        for(var i = 0; i < this.customwidget.length; i++) {
            if (! this.customwidget[i].sanityHS())
                return false;
        }

        return true;
    },

    enableRemove: function() {
        this.btnRemove.enabled = false;
        for (var i = 0; i < this.customwidget.length; i++) {
            if (this.customwidget[i].checked()) {
                this.btnRemove.enabled = true;
                break;
            }
        }
    },

    addService: function() {
        var pos = this.customwidget.length;
        this.customwidget.push(new HSWidget(pos, this));

        this.listLayout.insertWidget(0, this.customwidget[pos], 0, 0);
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
