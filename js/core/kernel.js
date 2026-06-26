window.Omega = window.Omega || {};

Omega.Kernel = {

    async initialize(moduleName) {

        Omega.Logger.info("Booting Ω Kernel");

        Omega.Logger.info("Loading Module", moduleName);

        Omega.Events.emit("kernel.initialized");

        return true;

    }

};
