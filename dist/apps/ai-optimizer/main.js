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
    (0, common_1.Get)('start'),
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
const ai_optimizer_controller_1 = __webpack_require__(/*! ./ai-optimizer.controller */ "./apps/ai-optimizer/src/ai-optimizer.controller.ts");
const ai_optimizer_service_1 = __webpack_require__(/*! ./ai-optimizer.service */ "./apps/ai-optimizer/src/ai-optimizer.service.ts");
let AiOptimizerModule = class AiOptimizerModule {
};
exports.AiOptimizerModule = AiOptimizerModule;
exports.AiOptimizerModule = AiOptimizerModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
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
        this.BACKTEST_URL = 'http://localhost:3002/backtest/run';
        this.API_URL = 'http://localhost:8081/strategies';
    }
    async mineStrategy(symbol, maxAttempts = 10) {
        this.logger.log(`⛏️ INICIAR MINERAÇÃO MANUAL para ${symbol} (Tentativas Máx: ${maxAttempts})...`);
        const hoje = new Date();
        const dataInicio = new Date();
        dataInicio.setMonth(hoje.getMonth() - 18);
        for (let i = 1; i <= maxAttempts; i++) {
            this.logger.log(`🔄 Tentativa ${i}/${maxAttempts}...`);
            const champion = await this.runOptimization(dataInicio, hoje, symbol);
            if (champion) {
                this.logger.log(`💎 SUCESSO! Estratégia vencedora encontrada na tentativa ${i}.`);
                this.logger.log(`📈 ROI VALIDADO: ${champion.stats.roi.toFixed(2)}%`);
                return champion;
            }
            else {
                this.logger.warn(`⚠️ Tentativa ${i} falhou (Rejeitada pelo WFA). A tentar outra vez...`);
            }
        }
        this.logger.error('❌ FIM: Esgotámos as tentativas. O mercado está difícil hoje.');
        return null;
    }
    async runOptimization(startDate, endDate, symbol) {
        this.logger.log(`🚀 A iniciar Walk-Forward Analysis (WFA) para ${symbol}...`);
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
            this.logger.log(`\n📅 CICLO: Treino [${trainEnd.toISOString().slice(0, 7)}] -> Validação [${testEnd.toISOString().slice(0, 7)}]`);
            const bestOfPeriod = await this.optimizeForPeriod(currentStart, trainEnd, symbol);
            if (!bestOfPeriod) {
                this.logger.warn('⚠️ Nenhuma estratégia viável neste período de treino.');
                currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
                continue;
            }
            const validationResult = await this.runBacktest(bestOfPeriod.gene, trainEnd, testEnd, symbol);
            if (validationResult) {
                this.logger.log(`📊 Resultado Real (OOS): ROI ${validationResult.totalReturnPct.toFixed(2)}% | DD ${validationResult.maxDrawdownPct.toFixed(2)}%`);
                totalWalkForwardProfit += validationResult.totalReturnPct;
                performanceLog.push({
                    period: `${trainEnd.toISOString().slice(0, 7)}`,
                    roi: validationResult.totalReturnPct,
                    drawdown: validationResult.maxDrawdownPct
                });
                if (validationResult.history && Array.isArray(validationResult.history)) {
                    fullTradeHistory = [...fullTradeHistory, ...validationResult.history];
                }
                bestGeneSoFar = bestOfPeriod.gene;
            }
            currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
        }
        this.logger.log('🏁 WFA Concluído!');
        this.logger.log(`💰 Retorno Acumulado (Líquido): ${totalWalkForwardProfit.toFixed(2)}%`);
        console.table(performanceLog);
        const failedMonths = performanceLog.filter(p => p.roi < -2).length;
        if (totalWalkForwardProfit > 10 && failedMonths <= 10 && bestGeneSoFar) {
            this.logger.log('✅ APROVADO: Estratégia robusta encontrada.');
            const avgRoi = totalWalkForwardProfit / (performanceLog.length || 1);
            await this.saveStrategy(bestGeneSoFar, symbol, totalWalkForwardProfit, avgRoi, fullTradeHistory);
            return {
                gene: bestGeneSoFar,
                stats: { roi: totalWalkForwardProfit }
            };
        }
        else {
            this.logger.error(`❌ REJEITADO: Lucro ${totalWalkForwardProfit.toFixed(2)}% insuficiente ou instável.`);
            return null;
        }
    }
    async optimizeForPeriod(start, end, symbol) {
        let population = Array.from({ length: 15 }, () => this.generateRandomGene());
        let bestResult = null;
        for (let generation = 1; generation <= 5; generation++) {
            const results = [];
            for (const gene of population) {
                const data = await this.runBacktest(gene, start, end, symbol);
                if (data) {
                    const fitness = this.calculateFitness(data);
                    const metrics = this.calculateAdvancedMetrics(data.history);
                    let adjustedFitness = fitness;
                    if (metrics.profitFactor < 1)
                        adjustedFitness -= 100;
                    results.push({
                        gene,
                        fitness: adjustedFitness,
                        stats: { roi: data.totalReturnPct, trades: data.totalTrades, winRate: data.winRate, drawdown: data.maxDrawdownPct }
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
            while (children.length < 15) {
                const parent = survivors[Math.floor(Math.random() * survivors.length)];
                const child = JSON.parse(JSON.stringify(parent));
                if (Math.random() < 0.4 && child.entryRules.length > 0) {
                    const idx = Math.floor(Math.random() * child.entryRules.length);
                    child.entryRules[idx] = this.generateRandomRule();
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
        const risk = data.maxDrawdownPct === 0 ? 0.1 : data.maxDrawdownPct;
        return (data.totalReturnPct / risk) * 100;
    }
    calculateAdvancedMetrics(trades) {
        if (!trades || trades.length === 0) {
            return { sortino: 0, sqn: 0, winRate: 0, profitFactor: 0 };
        }
        let grossWin = 0;
        let grossLoss = 0;
        trades.forEach((t) => {
            const pnl = t.roi;
            if (pnl > 0)
                grossWin += pnl;
            else
                grossLoss += Math.abs(pnl);
        });
        const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
        return { sortino: 0, sqn: 0, winRate: 0, profitFactor };
    }
    generateRandomGene() {
        const numEntry = Math.floor(Math.random() * 3) + 1;
        const numExit = Math.floor(Math.random() * 2);
        return {
            entryRules: Array.from({ length: numEntry }, () => this.generateRandomRule()),
            exitRules: Array.from({ length: numExit }, () => this.generateRandomRule()),
            stopLossPct: (Math.random() * 0.05) + 0.02,
            takeProfitPct: (Math.random() * 0.15) + 0.03,
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
        this.logger.log(`💾 A analisar histórico... (Total: ${history?.length})`);
        if (history && history.length > 0) {
            this.logger.log(`🔎 TRADE OBJECT: ${JSON.stringify(history[0])}`);
        }
        try {
            const wins = history.filter(t => t.roi > 0).length;
            const winRate = history.length > 0 ? (wins / history.length) * 100 : 0;
            let peak = 1000;
            let currentBalance = 1000;
            let maxDrawdown = 0;
            for (const trade of history) {
                currentBalance = currentBalance * (1 + (trade.roi / 100));
                if (currentBalance > peak) {
                    peak = currentBalance;
                }
                const dd = (peak - currentBalance) / peak;
                if (dd > maxDrawdown) {
                    maxDrawdown = dd;
                }
            }
            const apiPayload = {
                name: `WFA-Pro-${new Date().getTime()}`,
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
            this.logger.log(`💾 Estratégia WFA guardada! (WinRate: ${winRate.toFixed(1)}% | DD: ${(maxDrawdown * 100).toFixed(1)}%)`);
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
exports.ActionType = exports.ComparisonOperator = exports.IndicatorType = void 0;
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
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));
var ActionType;
(function (ActionType) {
    ActionType["BUY_SIGNAL"] = "BUY";
    ActionType["SELL_SIGNAL"] = "SELL";
    ActionType["WAIT"] = "WAIT";
})(ActionType || (exports.ActionType = ActionType = {}));


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