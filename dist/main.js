"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(require('express').json({ limit: '50mb' }));
    app.use(require('express').urlencoded({ limit: '50mb', extended: true }));
    app.setGlobalPrefix('api');
    app.enableCors();
    const port = process.env.PORT || 3000;
    await app.listen(port, () => {
        console.log(`Backend running on port ${port}`);
    });
}
bootstrap();
//# sourceMappingURL=main.js.map