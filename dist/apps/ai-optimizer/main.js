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
        this.logger.log(`⛏️ INICIAR MINERAÇÃO INSTITUCIONAL para ${symbol} (Tentativas: ${maxAttempts})...`);
        const hoje = new Date();
        const dataInicio = new Date();
        dataInicio.setMonth(hoje.getMonth() - 18);
        for (let i = 1; i <= maxAttempts; i++) {
            this.logger.log(`🔄 Tentativa ${i}/${maxAttempts}...`);
            const champion = await this.runOptimization(dataInicio, hoje, symbol);
            if (champion) {
                this.logger.log(`💎 SUCESSO! Estratégia encontrada na tentativa ${i}.`);
                this.logger.log(`📈 ROI VALIDADO: ${champion.stats.roi.toFixed(2)}% | Sortino: ${champion.stats.sortino.toFixed(2)}`);
                return champion;
            }
            else {
                this.logger.warn(`⚠️ Tentativa ${i} falhou. A reiniciar evolução...`);
            }
        }
        this.logger.error('❌ FIM: O mercado está difícil. Nenhuma estratégia robusta encontrada hoje.');
        return null;
    }
    async runOptimization(startDate, endDate, symbol) {
        this.logger.log(`🚀 A iniciar WFA (Long/Short) para ${symbol}...`);
        const trainWindowMonths = 3;
        const testWindowMonths = 1;
        let currentStart = new Date(startDate);
        let totalWalkForwardProfit = 0;
        const performanceLog = [];
        let fullTradeHistory = [];
        let bestGeneSoFar = null;
        while (true) {
            const trainEnd = new Date(currentStart);
            trainEnd.setMonth(trainEnd.getMonth() + trainWindowMonths);
            const testEnd = new Date(trainEnd);
            testEnd.setMonth(testEnd.getMonth() + testWindowMonths);
            if (testEnd > endDate)
                break;
            this.logger.log(`📅 TREINO: [${trainEnd.toISOString().slice(0, 7)}] -> TESTE: [${testEnd.toISOString().slice(0, 7)}]`);
            const bestOfPeriod = await this.optimizeForPeriod(currentStart, trainEnd, symbol);
            if (!bestOfPeriod) {
                this.logger.warn('⚠️ Nenhuma estratégia sobreviveu ao treino. A saltar mês...');
                currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
                continue;
            }
            const validationResult = await this.runBacktest(bestOfPeriod.gene, trainEnd, testEnd, symbol);
            if (validationResult) {
                this.logger.log(`📊 OOS Resultado: ROI ${validationResult.totalReturnPct.toFixed(2)}% | DD ${validationResult.maxDrawdownPct.toFixed(2)}%`);
                totalWalkForwardProfit += validationResult.totalReturnPct;
                performanceLog.push({
                    period: `${trainEnd.toISOString().slice(0, 7)}`,
                    roi: validationResult.totalReturnPct,
                    drawdown: validationResult.maxDrawdownPct
                });
                if (validationResult.history) {
                    fullTradeHistory = [...fullTradeHistory, ...validationResult.history];
                }
                bestGeneSoFar = bestOfPeriod.gene;
            }
            currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
        }
        this.logger.log(`💰 Lucro Total WFA: ${totalWalkForwardProfit.toFixed(2)}%`);
        console.table(performanceLog);
        const isProfitable = totalWalkForwardProfit > 5;
        const maxDD = Math.max(...performanceLog.map(p => p.drawdown));
        if (isProfitable && maxDD < 30 && bestGeneSoFar) {
            const avgRoi = totalWalkForwardProfit / (performanceLog.length || 1);
            await this.saveStrategy(bestGeneSoFar, symbol, totalWalkForwardProfit, avgRoi, fullTradeHistory);
            return { gene: bestGeneSoFar, stats: { roi: totalWalkForwardProfit, sortino: 0, trades: 0, winRate: 0, drawdown: maxDD } };
        }
        else {
            return null;
        }
    }
    async optimizeForPeriod(start, end, symbol) {
        const POPULATION_SIZE = 20;
        const GENERATIONS = 5;
        let population = Array.from({ length: POPULATION_SIZE }, () => this.generateRandomGene());
        let bestResult = null;
        for (let generation = 1; generation <= GENERATIONS; generation++) {
            const results = [];
            for (const gene of population) {
                const data = await this.runBacktest(gene, start, end, symbol);
                if (data) {
                    const fitness = this.calculateFitness(data);
                    results.push({
                        gene,
                        fitness,
                        stats: {
                            roi: data.totalReturnPct,
                            trades: data.totalTrades,
                            winRate: data.winRate,
                            drawdown: data.maxDrawdownPct,
                            sharpe: 0,
                            sortino: 0
                        }
                    });
                }
            }
            if (results.length === 0)
                continue;
            results.sort((a, b) => b.fitness - a.fitness);
            if (!bestResult || results[0].fitness > bestResult.fitness)
                bestResult = results[0];
            const survivors = results.slice(0, 5).map(r => r.gene);
            const children = [];
            while (children.length < POPULATION_SIZE) {
                const parent = survivors[Math.floor(Math.random() * survivors.length)];
                const child = JSON.parse(JSON.stringify(parent));
                if (Math.random() < 0.4) {
                    const isLong = Math.random() > 0.5;
                    const rules = isLong ? child.entryRulesLong : child.entryRulesShort;
                    if (rules && rules.length > 0) {
                        const idx = Math.floor(Math.random() * rules.length);
                        rules[idx] = this.generateRandomRule();
                    }
                }
                if (Math.random() < 0.2) {
                    child.stopLossPct = (Math.random() * 0.05) + 0.01;
                }
                children.push(child);
            }
            population = [...survivors, ...children];
        }
        return bestResult;
    }
    calculateFitness(data) {
        if (data.totalTrades < 5)
            return -1000;
        if (data.totalReturnPct <= 0)
            return data.totalReturnPct;
        const downside = data.downsideDeviation || 1;
        const sortino = data.totalReturnPct / downside;
        return (sortino * 50) + (data.winRate * 0.5);
    }
    generateRandomGene() {
        const numEntry = Math.floor(Math.random() * 2) + 1;
        return {
            entryRulesLong: Array.from({ length: numEntry }, () => this.generateRandomRule()),
            entryRulesShort: Array.from({ length: numEntry }, () => this.generateRandomRule()),
            exitRulesLong: [],
            exitRulesShort: [],
            stopLossType: Math.random() > 0.6 ? 'ATR' : 'FIXED',
            stopLossPct: (Math.random() * 0.04) + 0.01,
            atrMultiplier: (Math.random() * 2.5) + 1.5,
            atrPeriod: 14,
            takeProfitPct: (Math.random() * 0.10) + 0.02,
            breakEvenPct: (Math.random() * 0.03) + 0.01,
            trendFilter: Math.random() > 0.2,
            feePct: 0.001,
            slippagePct: 0.0005
        };
    }
    generateRandomRule() {
        const types = [genetic_bot_types_1.IndicatorType.RSI, genetic_bot_types_1.IndicatorType.MACD, genetic_bot_types_1.IndicatorType.SMA, genetic_bot_types_1.IndicatorType.EMA];
        const indicator = types[Math.floor(Math.random() * types.length)];
        const operators = [genetic_bot_types_1.ComparisonOperator.GREATER_THAN, genetic_bot_types_1.ComparisonOperator.LESS_THAN];
        const op = operators[Math.floor(Math.random() * operators.length)];
        let value = 0;
        let period = 14;
        if (indicator === genetic_bot_types_1.IndicatorType.RSI) {
            value = Math.floor(Math.random() * 80) + 10;
            period = Math.floor(Math.random() * 20) + 5;
        }
        else if (indicator === genetic_bot_types_1.IndicatorType.MACD) {
            value = 0;
        }
        else {
            value = 'PRICE';
            period = Math.random() > 0.5 ? 20 : (Math.random() > 0.5 ? 50 : 200);
        }
        return { indicator, period, operator: op, value, weight: Math.random() };
    }
    async runBacktest(gene, start, end, symbol) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.BACKTEST_URL, {
                symbol: symbol,
                startDate: start,
                endDate: end,
                initialCapital: 1000,
                strategy: gene
            }));
            return response.data;
        }
        catch (e) {
            return null;
        }
    }
    async saveStrategy(gene, symbol, totalRoi, avgRoi, history) {
        try {
            const wins = history.filter(t => t.roi > 0).length;
            const winRate = history.length > 0 ? (wins / history.length) * 100 : 0;
            let peak = 1000;
            let currentBalance = 1000;
            let maxDrawdown = 0;
            for (const trade of history) {
                currentBalance = currentBalance * (1 + (trade.roi / 100));
                if (currentBalance > peak)
                    peak = currentBalance;
                const dd = (peak - currentBalance) / peak;
                if (dd > maxDrawdown)
                    maxDrawdown = dd;
            }
            const apiPayload = {
                name: `Alpha-Gen-${new Date().getTime().toString().slice(-4)}`,
                symbol: symbol,
                config: gene,
                roi: totalRoi,
                drawdown: maxDrawdown * 100,
                winRate: winRate,
                trades: history.length,
                trainStartDate: new Date(),
                trainEndDate: new Date(),
                tradeHistory: history
            };
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.API_URL, apiPayload));
            this.logger.log(`💾 ESTRATÉGIA GUARDADA! (WinRate: ${winRate.toFixed(1)}% | DD: ${(maxDrawdown * 100).toFixed(1)}%)`);
        }
        catch (e) {
            this.logger.error('Erro ao guardar: ' + e.message);
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
exports.ComparisonOperator = exports.IndicatorType = void 0;
var IndicatorType;
(function (IndicatorType) {
    IndicatorType["RSI"] = "RSI";
    IndicatorType["MACD"] = "MACD";
    IndicatorType["SMA"] = "SMA";
    IndicatorType["EMA"] = "EMA";
})(IndicatorType || (exports.IndicatorType = IndicatorType = {}));
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["GREATER_THAN"] = ">";
    ComparisonOperator["LESS_THAN"] = "<";
    ComparisonOperator["CROSS_OVER"] = "CROSS_OVER";
    ComparisonOperator["CROSS_UNDER"] = "CROSS_UNDER";
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));


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