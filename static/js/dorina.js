function Regulator(name, data) {
    var self = this;

    self.name = name;
    self.summary = data.summary;
    self.description = data.description;
    self.methods = data.methods;
    self.references = data.references;
}

function DoRiNAViewModel(net) {
    var self = this;
    self.retry_after = 1000;
    self.clades = ko.observableArray([]);
    self.genomes = ko.observableArray([]);
    self.assemblies = ko.observableArray([]);

    self.chosenClade = ko.observable();
    self.chosenGenome = ko.observable();
    self.chosenAssembly = ko.observable();

    self.rbps = ko.observableArray([]);
    self.selected_rbps = ko.observableArray([]);

    self.mirnas = ko.observableArray([]);
    self.selected_mirnas = ko.observableArray([]);

    self.results = ko.observableArray([]);

    self.more_results = ko.observable(false);
    self.offset = ko.observable(0);
    self.pending = ko.observable(true);

    self.get_clades = function() {
        return net.getJSON("clades").then(function(data) {
            self.clades.removeAll();
            for (var i in data.clades) {
                self.clades.push(data.clades[i]);
            }
        });
    };

    self.get_genomes = function(clade) {
        return net.getJSON("genomes/" + clade).then(function(data) {
            self.genomes.removeAll();
            for (var i in data.genomes) {
                self.genomes.push(data.genomes[i]);
            }
        });
    };

    self.get_assemblies = function(clade, genome) {
        return net.getJSON("assemblies/" + clade + "/" + genome).then(function(data) {
            self.assemblies.removeAll();
            for (var i in data.assemblies) {
                self.assemblies.push(data.assemblies[i]);
            }
        });
    };

    self.show_simple_search = function() {
        var search_path = "regulators/";
        search_path += self.chosenClade() + "/";
        search_path += self.chosenGenome() + "/";
        search_path += self.chosenAssembly();

        return net.getJSON(search_path).then(function(data) {
            self.rbps.removeAll();
            self.mirnas.removeAll();
            for (var i in data['RBP']) {
                self.rbps.push(new Regulator(i, data['RBP'][i]));
            }
            for (var i in data['miRNA']) {
                self.mirnas.push(new Regulator(i, data['miRNA'][i]));
            }
            $('#chooseDatabase').collapse('hide');
            $('#search').collapse('show');
        });
    };

    self.run_search = function(keep_data) {
        var regulators = [];
        var rbps = self.selected_rbps();
        var mirnas = self.selected_mirnas();

        for (var i in rbps) {
            regulators.push(rbps[i].name);
        }
        for (var i in mirnas) {
            regulators.push(mirnas[i].name);
        }

        var search_data = {
            set_a: regulators,
            assembly: self.chosenAssembly(),
            offset: self.offset()
        };
        self.pending(true);
        $('#search').collapse('hide');
        $('#results').collapse('show');
        if (!keep_data) {
            self.results.removeAll();
        }
        return net.post('search', search_data).then(function(data) {
            if (data.state == 'pending') {
                setTimeout(function() {
                    self.run_search(keep_data);
                }, self.retry_after);
                return;
            }

            self.pending(false);
            self.more_results(data.more_results);
            for (var i in data.results) {
                self.results.push(data.results[i]);
            }
            if (data.next_offset) {
                self.offset(data.next_offset);
            }
        });
    };

    self.run_simple_search = function() {
        self.run_search(false);
    };

    self.load_more_results = function() {
        self.run_search(true);
    };

    self.new_search = function() {
        $('#search').collapse('hide');
        $('#results').collapse('hide');
        $('#chooseDatabase').collapse('show');
        self.more_results(false);
    };

}

function SetViewModel(view_model) {
        $(document).data('view_model', view_model);
}

function GetViewModel() {
        return $(document).data('view_model');
}

