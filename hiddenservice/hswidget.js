importExtension("qt");
importExtension("qt.core");
importExtension("qt.gui");

function HSWidget(index, parent) {
    QWidget.call(this, parent);

    this.pluginParent = parent;

    var widgetui = new QFile(pluginPath + "/hiddenservice/customWidget.ui");
    var loader = new QUiLoader();
    widgetui.open(QIODevice.ReadOnly);

    this.address = new QHostAddress();

    this.customwidget = loader.load(widgetui);

    this.grpBox = this.customwidget.children()[findWidget(this.customwidget, "groupBox")];
    this.lineDir = this.grpBox.children()[findWidget(this.grpBox, "lineDir")];
    this.spinPort = this.grpBox.children()[findWidget(this.grpBox, "spinPort")];
    this.lineAddress = this.grpBox.children()[findWidget(this.grpBox, "lineAddress")];
    this.lineName = this.grpBox.children()[findWidget(this.grpBox, "lineName")];
    this.chkBox = this.grpBox.children()[findWidget(this.grpBox, "checkBox")];
    this.btnBrowse = this.grpBox.children()[findWidget(this.grpBox, "btnBrowse")];
    this.lineError = this.grpBox.children()[findWidget(this.grpBox, "lineError")];

    try {
        this.hidservdir = torrc.value("HiddenServiceDir")[index];
        this.hidservport = torrc.value("HiddenServicePort")[index];
        var file = new QFile(this.hidservdir + "/hostname");
        if(file.open(QIODevice.ReadOnly))
        {
            var textStream = new QTextStream(file);
            this.lineName.setText(textStream.readLine());
        }

        this.lineDir.setText(this.hidservdir);
        this.spinPort.value = this.hidservport.split(" ")[0];

        if (this.hidservport.split(" ")[1])
            this.lineAddress.setText(this.hidservport.split(" ")[1]);
        else
            this.lineAddress.setText("127.0.0.1");
    }
    catch(err) {}

    this.lineError.hide();

    this.chkBox['stateChanged(int)'].connect(this, this.enableRemove);
    this.lineDir['textChanged(QString)'].connect(this, this.toggleApply);
    this.spinPort['valueChanged(int)'].connect(this, this.toggleApply);
    this.lineAddress['textEdited(QString)'].connect(this, this.toggleApply);
    this.btnBrowse['clicked()'].connect(this, this.browseDir);

    var layout = new QVBoxLayout(this);
    layout.addWidget(this.customwidget, 0, 0);
}

HSWidget.prototype = new QWidget();

HSWidget.prototype.browseDir = function() {
    dir = QFileDialog.getExistingDirectory(this, "Browse Directory", "/home");
    if (dir)
        this.lineDir.setText(dir);
}

HSWidget.prototype.apply = function() {
    torrc.setValue("HiddenServiceDir", this.lineDir.text);
    torrc.setValue("HiddenServicePort", this.spinPort.value + " " + this.lineAddress.text);
}

HSWidget.prototype.toggleApply = function() {
    this.pluginParent.toggleApply();
}

HSWidget.prototype.sanityHS = function() {
    var ip = this.lineAddress.text.split(":");
    var port = this.spinPort.value;

    if(! this.address.setAddress(ip[0])) {
        this.lineError.text = "Invalid IP address";
        this.lineError.show();
        return false;
    }

    if (ip[1]) {
        if(/\D/.test(ip[1]) || ip[1] < 1 || ip[1] > 65535) {
            this.lineError.text = "Invalid port address";
            this.lineError.show();
            return false;
        }
    }

    this.lineError.hide();
    return true;
}

HSWidget.prototype.enableRemove = function() {
    this.pluginParent.enableRemove();
}

HSWidget.prototype.checked = function() {
    if (this.chkBox.checkState() == Qt.Checked)
        return true;
    else
        return false;
}
