/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./apps/ai-optimizer/src/ai-optimizer.controller.ts":
/*!**********************************************************!*\
  !*** ./apps/ai-optimizer/src/ai-optimizer.controller.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AiOptimizerController_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiOptimizerController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const ai_optimizer_service_1 = __webpack_require__(/*! ./ai-optimizer.service */ "./apps/ai-optimizer/src/ai-optimizer.service.ts");
let AiOptimizerController = AiOptimizerController_1 = class AiOptimizerController {
    constructor(optimizerService) {
        this.optimizerService = optimizerService;
        this.logger = new common_1.Logger(AiOptimizerController_1.name);
    }
    async startOptimization(symbol = 'BTCUSDT', attempts = '10') {
        const maxAttempts = parseInt(attempts, 10);
        const champion = await this.optimizerService.mineStrategy(symbol, maxAttempts);
        if (champion) {
            return {
                message: `Mineração concluída! Encontrado novo campeão para ${symbol}.`,
                roi: champion.stats.roi.toFixed(2),
                gene: champion.gene,
            };
        }
        else {
            throw new common_1.HttpException({
                status: common_1.HttpStatus.ACCEPTED,
                message: `Mineração falhou após ${maxAttempts} tentativas. Nenhuma estratégia passou nos critérios WFA.`,
            }, common_1.HttpStatus.ACCEPTED);
        }
    }
};
exports.AiOptimizerController = AiOptimizerController;
__decorate([
    (0, common_1.Post)('start'),
    __param(0, (0, common_1.Query)('symbol')),
    __param(1, (0, common_1.Query)('attempts')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AiOptimizerController.prototype, "startOptimization", null);
exports.AiOptimizerController = AiOptimizerController = AiOptimizerController_1 = __decorate([
    (0, common_1.Controller)('optimizer'),
    __metadata("design:paramtypes", [typeof (_a = typeof ai_optimizer_service_1.AiOptimizerService !== "undefined" && ai_optimizer_service_1.AiOptimizerService) === "function" ? _a : Object])
], AiOptimizerController);


/***/ }),

/***/ "./apps/ai-optimizer/src/ai-optimizer.module.ts":
/*!******************************************************!*\
  !*** ./apps/ai-optimizer/src/ai-optimizer.module.ts ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiOptimizerModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const axios_1 = __webpack_require__(/*! @nestjs/axios */ "@nestjs/axios");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const ai_optimizer_controller_1 = __webpack_require__(/*! ./ai-optimizer.controller */ "./apps/ai-optimizer/src/ai-optimizer.controller.ts");
const ai_optimizer_service_1 = __webpack_require__(/*! ./ai-optimizer.service */ "./apps/ai-optimizer/src/ai-optimizer.service.ts");
let AiOptimizerModule = class AiOptimizerModule {
};
exports.AiOptimizerModule = AiOptimizerModule;
exports.AiOptimizerModule = AiOptimizerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            axios_1.HttpModule
        ],
        controllers: [ai_optimizer_controller_1.AiOptimizerController],
        providers: [ai_optimizer_service_1.AiOptimizerService],
    })
], AiOptimizerModule);


/***/ }),

/***/ "./apps/ai-optimizer/src/ai-optimizer.service.ts":
/*!*******************************************************!*\
  !*** ./apps/ai-optimizer/src/ai-optimizer.service.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiOptimizerService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiOptimizerService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const axios_1 = __webpack_require__(/*! @nestjs/axios */ "@nestjs/axios");
const rxjs_1 = __webpack_require__(/*! rxjs */ "rxjs");
const genetic_bot_types_1 = __webpack_require__(/*! ./genetic-bot.types */ "./apps/ai-optimizer/src/genetic-bot.types.ts");
let AiOptimizerService = AiOptimizerService_1 = class AiOptimizerService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(AiOptimizerService_1.name);
        this.BACKTEST_URL = process.env.BACKTEST_URL || 'http://backtest-engine:3002/backtest/run';
        this.API_URL = process.env.API_URL || 'http://api-server:8081/strategies';
    }
    async mineStrategy(symbol, maxAttempts = 10) {
        this.logger.log(`⛏️ INICIAR MINERAÇÃO HÍBRIDA para ${symbol}...`);
        const hoje = new Date();
        const dataInicio = new Date();
        dataInicio.setMonth(hoje.getMonth() - 18);
        for (let i = 1; i <= maxAttempts; i++) {
            this.logger.log(`🔄 Tentativa ${i}/${maxAttempts}...`);
            const champion = await this.runOptimization(dataInicio, hoje, symbol);
            if (champion) {
                this.logger.log(`💎 SUCESSO! ROI: ${champion.stats.roi.toFixed(2)}% | DD: ${champion.stats.drawdown.toFixed(2)}%`);
                return champion;
            }
        }
        this.logger.error('❌ Nenhuma estratégia robusta encontrada.');
        return null;
    }
    async runOptimization(startDate, endDate, symbol) {
        this.logger.log(`🚀 WFA em curso...`);
        const trainWindowMonths = 3;
        const testWindowMonths = 1;
        let currentStart = new Date(startDate);
        let totalProfit = 0;
        const log = [];
        let fullHistory = [];
        let bestGene = null;
        while (true) {
            const trainEnd = new Date(currentStart);
            trainEnd.setMonth(trainEnd.getMonth() + trainWindowMonths);
            const testEnd = new Date(trainEnd);
            testEnd.setMonth(testEnd.getMonth() + testWindowMonths);
            if (testEnd > endDate)
                break;
            this.logger.log(`📅 TREINO: [${trainEnd.toISOString().slice(0, 7)}] -> TESTE: [${testEnd.toISOString().slice(0, 7)}]`);
            const best = await this.optimizeForPeriod(currentStart, trainEnd, symbol);
            if (!best) {
                this.logger.warn('⚠️ Sem estratégia viável no treino.');
                currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
                continue;
            }
            const res = await this.runBacktest(best.gene, trainEnd, testEnd, symbol);
            if (res) {
                this.logger.log(`📊 OOS Resultado: ROI ${res.totalReturnPct.toFixed(2)}% | DD ${res.maxDrawdownPct.toFixed(2)}%`);
                totalProfit += res.totalReturnPct;
                log.push({ period: testEnd.toISOString().slice(0, 7), roi: res.totalReturnPct, dd: res.maxDrawdownPct });
                if (res.history)
                    fullHistory = [...fullHistory, ...res.history];
                bestGene = best.gene;
            }
            currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
        }
        const maxDD = Math.max(...log.map(p => p.dd));
        const isViable = totalProfit > 0 && maxDD < 20;
        if (isViable && bestGene) {
            await this.saveStrategy(bestGene, symbol, totalProfit, maxDD, fullHistory);
            return { gene: bestGene, stats: { roi: totalProfit, drawdown: maxDD, sortino: 0, trades: 0, winRate: 0 } };
        }
        return null;
    }
    getClassicStrategies() {
        const seeds = [];
        seeds.push({
            entryRulesLong: [],
            entryRulesShort: [
                { indicator: genetic_bot_types_1.IndicatorType.RSI, period: 14, operator: genetic_bot_types_1.ComparisonOperator.GREATER_THAN, value: 70, weight: 1 },
                { indicator: genetic_bot_types_1.IndicatorType.EMA, period: 50, operator: genetic_bot_types_1.ComparisonOperator.LESS_THAN, value: 'PRICE', weight: 1 }
            ],
            exitRulesLong: [], exitRulesShort: [],
            stopLossType: 'ATR', stopLossPct: 0, atrMultiplier: 2, atrPeriod: 14,
            takeProfitPct: 0.08, breakEvenPct: 0.02, trendFilter: false, adxMin: 15,
            feePct: 0.001, slippagePct: 0.0005
        });
        seeds.push({
            entryRulesLong: [
                { indicator: genetic_bot_types_1.IndicatorType.RSI, period: 14, operator: genetic_bot_types_1.ComparisonOperator.LESS_THAN, value: 40, weight: 1 },
            ],
            entryRulesShort: [],
            exitRulesLong: [], exitRulesShort: [],
            stopLossType: 'ATR', stopLossPct: 0, atrMultiplier: 2.5, atrPeriod: 14,
            takeProfitPct: 0.12, breakEvenPct: 0.015, trendFilter: true, adxMin: 20,
            feePct: 0.001, slippagePct: 0.0005
        });
        seeds.push({
            entryRulesLong: [{ indicator: genetic_bot_types_1.IndicatorType.SMA, period: 20, operator: genetic_bot_types_1.ComparisonOperator.LESS_THAN, value: 'PRICE', weight: 1 }],
            entryRulesShort: [{ indicator: genetic_bot_types_1.IndicatorType.SMA, period: 20, operator: genetic_bot_types_1.ComparisonOperator.GREATER_THAN, value: 'PRICE', weight: 1 }],
            exitRulesLong: [], exitRulesShort: [],
            stopLossType: 'FIXED', stopLossPct: 0.02, atrMultiplier: 0, atrPeriod: 0,
            takeProfitPct: 0.05, breakEvenPct: 0.01, trendFilter: false, adxMin: 25,
            feePct: 0.001, slippagePct: 0.0005
        });
        return seeds;
    }
    async optimizeForPeriod(start, end, symbol) {
        const POPULATION_SIZE = 60;
        const GENERATIONS = 15;
        const seeds = this.getClassicStrategies();
        const randomCount = POPULATION_SIZE - seeds.length;
        let population = [...seeds, ...Array.from({ length: randomCount }, () => this.generateRandomGene())];
        let bestResult = null;
        for (let generation = 1; generation <= GENERATIONS; generation++) {
            const results = [];
            for (const gene of population) {
                const data = await this.runBacktest(gene, start, end, symbol);
                if (data) {
                    const fitness = this.calculateFitness(data);
                    results.push({ gene, fitness, stats: { roi: data.totalReturnPct, trades: data.totalTrades, winRate: data.winRate, drawdown: data.maxDrawdownPct, sharpe: 0, sortino: 0 } });
                }
            }
            if (results.length === 0)
                continue;
            results.sort((a, b) => b.fitness - a.fitness);
            if (!bestResult || results[0].fitness > bestResult.fitness)
                bestResult = results[0];
            const survivors = results.slice(0, 10).map(r => r.gene);
            const children = [];
            while (children.length < POPULATION_SIZE) {
                const parent = survivors[Math.floor(Math.random() * survivors.length)];
                const child = JSON.parse(JSON.stringify(parent));
                if (Math.random() < 0.3) {
                    if (child.adxMin > 10)
                        child.adxMin -= 2;
                }
                if (Math.random() < 0.3) {
                    child.breakEvenPct = Math.random() * 0.02 + 0.005;
                }
                children.push(child);
            }
            population = [...survivors, ...children];
        }
        return bestResult;
    }
    calculateFitness(data) {
        if (data.totalTrades < 3)
            return -100;
        if (data.totalReturnPct <= 0)
            return data.totalReturnPct;
        const dd = data.maxDrawdownPct === 0 ? 0.5 : data.maxDrawdownPct;
        const score = data.totalReturnPct / dd;
        return score;
    }
    generateRandomGene() {
        const numEntry = Math.floor(Math.random() * 2) + 1;
        return {
            entryRulesLong: Array.from({ length: numEntry }, () => this.generateRandomRule()),
            entryRulesShort: Array.from({ length: numEntry }, () => this.generateRandomRule()),
            exitRulesLong: [], exitRulesShort: [],
            stopLossType: Math.random() > 0.5 ? 'ATR' : 'FIXED',
            stopLossPct: [0.015, 0.02, 0.03][Math.floor(Math.random() * 3)],
            atrMultiplier: [1.5, 2.0, 2.5, 3.0][Math.floor(Math.random() * 4)],
            atrPeriod: 14,
            takeProfitPct: [0.04, 0.06, 0.10, 0.15][Math.floor(Math.random() * 4)],
            breakEvenPct: [0.01, 0.015, 0.02][Math.floor(Math.random() * 3)],
            trendFilter: Math.random() > 0.4,
            adxMin: [10, 15, 20][Math.floor(Math.random() * 3)],
            feePct: 0.001, slippagePct: 0.0005
        };
    }
    generateRandomRule() {
        const indicator = ['RSI', 'SMA', 'EMA'][Math.floor(Math.random() * 3)];
        const op = [genetic_bot_types_1.ComparisonOperator.GREATER_THAN, genetic_bot_types_1.ComparisonOperator.LESS_THAN][Math.floor(Math.random() * 2)];
        let value = 0;
        let period = 14;
        if (indicator === 'RSI') {
            value = [25, 30, 35, 65, 70, 75][Math.floor(Math.random() * 6)];
            period = genetic_bot_types_1.INDICATOR_GRID.RSI_PERIODS[Math.floor(Math.random() * genetic_bot_types_1.INDICATOR_GRID.RSI_PERIODS.length)];
        }
        else {
            value = 'PRICE';
            period = genetic_bot_types_1.INDICATOR_GRID.EMA_PERIODS[Math.floor(Math.random() * genetic_bot_types_1.INDICATOR_GRID.EMA_PERIODS.length)];
        }
        return { indicator: indicator, period, operator: op, value, weight: 1 };
    }
    async runBacktest(gene, start, end, symbol) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.BACKTEST_URL, {
                symbol, startDate: start, endDate: end, initialCapital: 1000, strategy: gene
            }));
            return response.data;
        }
        catch (e) {
            return null;
        }
    }
    async saveStrategy(gene, symbol, roi, dd, history) {
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.API_URL, {
                name: `Institucional-${new Date().getTime().toString().slice(-4)}`,
                symbol, config: gene, roi, drawdown: dd, winRate: 0, trades: history.length, tradeHistory: history,
                trainStartDate: new Date(), trainEndDate: new Date()
            }));
            this.logger.log(`💾 ESTRATÉGIA SALVA COM SUCESSO!`);
        }
        catch (e) {
            this.logger.error('Erro ao salvar estratégia');
        }
    }
};
exports.AiOptimizerService = AiOptimizerService;
exports.AiOptimizerService = AiOptimizerService = AiOptimizerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object])
], AiOptimizerService);


/***/ }),

/***/ "./apps/ai-optimizer/src/genetic-bot.types.ts":
/*!****************************************************!*\
  !*** ./apps/ai-optimizer/src/genetic-bot.types.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.INDICATOR_GRID = exports.ComparisonOperator = exports.IndicatorType = void 0;
var IndicatorType;
(function (IndicatorType) {
    IndicatorType["RSI"] = "RSI";
    IndicatorType["MACD"] = "MACD";
    IndicatorType["SMA"] = "SMA";
    IndicatorType["EMA"] = "EMA";
    IndicatorType["ADX"] = "ADX";
    IndicatorType["CORR_BTC"] = "CORR_BTC";
})(IndicatorType || (exports.IndicatorType = IndicatorType = {}));
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["GREATER_THAN"] = ">";
    ComparisonOperator["LESS_THAN"] = "<";
    ComparisonOperator["CROSS_OVER"] = "CROSS_OVER";
    ComparisonOperator["CROSS_UNDER"] = "CROSS_UNDER";
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));
exports.INDICATOR_GRID = {
    RSI_PERIODS: [14, 21],
    EMA_PERIODS: [9, 21, 50, 100, 200],
    SMA_PERIODS: [20, 50, 200],
    ATR_PERIODS: [14],
    ADX_PERIODS: [14],
    CORR_PERIODS: [14]
};


/***/ }),

/***/ "@nestjs/axios":
/*!********************************!*\
  !*** external "@nestjs/axios" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("@nestjs/axios");

/***/ }),

/***/ "@nestjs/common":
/*!*********************************!*\
  !*** external "@nestjs/common" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),

/***/ "@nestjs/config":
/*!*********************************!*\
  !*** external "@nestjs/config" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),

/***/ "@nestjs/core":
/*!*******************************!*\
  !*** external "@nestjs/core" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),

/***/ "rxjs":
/*!***********************!*\
  !*** external "rxjs" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("rxjs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!***************************************!*\
  !*** ./apps/ai-optimizer/src/main.ts ***!
  \***************************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const ai_optimizer_module_1 = __webpack_require__(/*! ./ai-optimizer.module */ "./apps/ai-optimizer/src/ai-optimizer.module.ts");
async function bootstrap() {
    const app = await core_1.NestFactory.create(ai_optimizer_module_1.AiOptimizerModule);
    await app.listen(process.env.port ?? 3003);
}
bootstrap();

})();

/******/ })()
;