window.Omega = window.Omega || {};

Omega.Application = {

    async start(moduleName) {

        await Omega.Kernel.initialize(moduleName);

        Omega.Logger.success(moduleName + " loaded");

    }

};
