/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./apps/backtest-engine/src/backtest-engine.controller.ts":
/*!****************************************************************!*\
  !*** ./apps/backtest-engine/src/backtest-engine.controller.ts ***!
  \****************************************************************/
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
var BacktestEngineController_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BacktestEngineController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const backtest_engine_service_1 = __webpack_require__(/*! ./backtest-engine.service */ "./apps/backtest-engine/src/backtest-engine.service.ts");
let BacktestEngineController = BacktestEngineController_1 = class BacktestEngineController {
    constructor(backtestService) {
        this.backtestService = backtestService;
        this.logger = new common_1.Logger(BacktestEngineController_1.name);
    }
    async run(body) {
        this.logger.log('📥 [BacktestEngine] Pedido recebido.');
        const input = {
            symbol: body.symbol || 'BTCUSDT',
            startDate: new Date(body.startDate || '2024-01-01'),
            endDate: new Date(body.endDate || '2024-02-01'),
            initialCapital: body.initialCapital || 1000,
            strategy: body.strategy
        };
        return this.backtestService.runBacktest(input);
    }
};
exports.BacktestEngineController = BacktestEngineController;
__decorate([
    (0, common_1.Post)('run'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BacktestEngineController.prototype, "run", null);
exports.BacktestEngineController = BacktestEngineController = BacktestEngineController_1 = __decorate([
    (0, common_1.Controller)('backtest'),
    __metadata("design:paramtypes", [typeof (_a = typeof backtest_engine_service_1.BacktestEngineService !== "undefined" && backtest_engine_service_1.BacktestEngineService) === "function" ? _a : Object])
], BacktestEngineController);


/***/ }),

/***/ "./apps/backtest-engine/src/backtest-engine.module.ts":
/*!************************************************************!*\
  !*** ./apps/backtest-engine/src/backtest-engine.module.ts ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BacktestEngineModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const bullmq_1 = __webpack_require__(/*! @nestjs/bullmq */ "@nestjs/bullmq");
const technical_analysis_1 = __webpack_require__(/*! @app/technical-analysis */ "./libs/technical-analysis/src/index.ts");
const kline_entity_1 = __webpack_require__(/*! ../../data-collector/src/entities/kline.entity */ "./apps/data-collector/src/entities/kline.entity.ts");
const path = __webpack_require__(/*! path */ "path");
const backtest_engine_controller_1 = __webpack_require__(/*! ./backtest-engine.controller */ "./apps/backtest-engine/src/backtest-engine.controller.ts");
const backtest_engine_service_1 = __webpack_require__(/*! ./backtest-engine.service */ "./apps/backtest-engine/src/backtest-engine.service.ts");
let BacktestEngineModule = class BacktestEngineModule {
};
exports.BacktestEngineModule = BacktestEngineModule;
exports.BacktestEngineModule = BacktestEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: path.join(process.cwd(), '.env')
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const host = config.get('DB_HOST') || 'localhost';
                    const port = config.get('DB_PORT') || 5432;
                    const username = config.get('DB_USERNAME') || 'user';
                    const password = config.get('DB_PASSWORD') || 'passwordSegura123';
                    const database = config.get('DB_NAME') || 'optafund';
                    console.log(`[BacktestEngine] A ligar a Postgres: ${host}:${port}`);
                    return {
                        type: 'postgres',
                        host: host,
                        port: Number(port),
                        username: username,
                        password: password,
                        database: database,
                        entities: [kline_entity_1.Kline],
                        synchronize: false,
                    };
                },
            }),
            typeorm_1.TypeOrmModule.forFeature([kline_entity_1.Kline]),
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: {
                        host: 'localhost',
                        port: 6379,
                    },
                }),
            }),
            technical_analysis_1.TechnicalAnalysisModule,
        ],
        controllers: [backtest_engine_controller_1.BacktestEngineController],
        providers: [backtest_engine_service_1.BacktestEngineService],
    })
], BacktestEngineModule);


/***/ }),

/***/ "./apps/backtest-engine/src/backtest-engine.service.ts":
/*!*************************************************************!*\
  !*** ./apps/backtest-engine/src/backtest-engine.service.ts ***!
  \*************************************************************/
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
var BacktestEngineService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BacktestEngineService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const kline_entity_1 = __webpack_require__(/*! ./entities/kline.entity */ "./apps/backtest-engine/src/entities/kline.entity.ts");
const TA = __webpack_require__(/*! technicalindicators */ "technicalindicators");
let BacktestEngineService = BacktestEngineService_1 = class BacktestEngineService {
    constructor(klineRepo) {
        this.klineRepo = klineRepo;
        this.logger = new common_1.Logger(BacktestEngineService_1.name);
        this.TRADING_FEE = 0.001;
    }
    async runBacktest(params) {
        const klines = await this.klineRepo.find({
            where: {
                symbol: params.symbol,
                time: (0, typeorm_2.Between)(Math.floor(params.startDate.getTime() / 1000), Math.floor(params.endDate.getTime() / 1000)),
            },
            order: { time: 'ASC' },
        });
        if (klines.length < 200) {
            return { error: 'Dados insuficientes para calcular indicadores (min 200 velas).' };
        }
        const closes = klines.map(k => parseFloat(k.close));
        const indicators = this.calculateIndicators(closes, params.strategy);
        let balance = params.initialCapital;
        let position = null;
        const trades = [];
        const equityCurve = [{ date: new Date(klines[0].time * 1000), balance }];
        for (let i = 200; i < klines.length; i++) {
            const candle = klines[i];
            const currentPrice = parseFloat(candle.close);
            const currentDate = new Date(candle.time * 1000);
            if (!position) {
                if (this.checkEntryRules(i, currentPrice, params.strategy.entryRules, indicators)) {
                    const size = (balance * (1 - this.TRADING_FEE)) / currentPrice;
                    position = {
                        entryPrice: currentPrice,
                        size: size,
                        entryIndex: i
                    };
                }
            }
            else {
                let exitPrice = 0;
                let reason = '';
                const slPrice = position.entryPrice * (1 - params.strategy.stopLossPct);
                const tpPrice = position.entryPrice * (1 + params.strategy.takeProfitPct);
                const low = parseFloat(candle.low);
                const high = parseFloat(candle.high);
                if (low <= slPrice) {
                    exitPrice = slPrice;
                    reason = 'STOP_LOSS';
                }
                else if (high >= tpPrice) {
                    exitPrice = tpPrice;
                    reason = 'TAKE_PROFIT';
                }
                else if (this.checkExitRules(i, currentPrice, params.strategy.exitRules, indicators)) {
                    exitPrice = currentPrice;
                    reason = 'EXIT_RULE';
                }
                if (exitPrice > 0) {
                    const grossValue = position.size * exitPrice;
                    const netValue = grossValue * (1 - this.TRADING_FEE);
                    const profit = netValue - balance;
                    const roiPct = ((netValue - balance) / balance) * 100;
                    balance = netValue;
                    trades.push({
                        entryDate: new Date(klines[position.entryIndex].time * 1000),
                        exitDate: currentDate,
                        entryPrice: position.entryPrice,
                        exitPrice: exitPrice,
                        roi: roiPct,
                        reason
                    });
                    position = null;
                }
            }
            if (!position || i % 60 === 0) {
                equityCurve.push({ date: currentDate, balance: position ? balance : balance });
            }
        }
        const totalReturnPct = ((balance - params.initialCapital) / params.initialCapital) * 100;
        let peak = params.initialCapital;
        let maxDrawdownPct = 0;
        let runningBalance = params.initialCapital;
        for (const trade of trades) {
            const tradeProfit = runningBalance * (trade.roi / 100);
            runningBalance += tradeProfit;
            if (runningBalance > peak)
                peak = runningBalance;
            const dd = (peak - runningBalance) / peak;
            if (dd > maxDrawdownPct)
                maxDrawdownPct = dd;
        }
        const wins = trades.filter(t => t.roi > 0).length;
        const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
        return {
            totalReturnPct,
            totalTrades: trades.length,
            maxDrawdownPct: maxDrawdownPct * 100,
            winRate,
            finalBalance: balance,
            history: trades,
            equityCurve
        };
    }
    calculateIndicators(closes, strategy) {
        const indicators = {};
        const rules = [...strategy.entryRules, ...strategy.exitRules];
        rules.forEach(rule => {
            const key = `${rule.indicator}_${rule.period}`;
            if (indicators[key])
                return;
            if (rule.indicator === 'RSI') {
                indicators[key] = TA.RSI.calculate({ period: rule.period, values: closes });
            }
            else if (rule.indicator === 'SMA') {
                indicators[key] = TA.SMA.calculate({ period: rule.period, values: closes });
            }
            else if (rule.indicator === 'EMA') {
                indicators[key] = TA.EMA.calculate({ period: rule.period, values: closes });
            }
            else if (rule.indicator === 'MACD') {
                indicators['MACD_STD'] = TA.MACD.calculate({
                    values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false
                });
            }
        });
        return indicators;
    }
    checkEntryRules(index, currentPrice, rules, indicators) {
        if (rules.length === 0)
            return true;
        return rules.every(rule => {
            const val = this.getIndicatorValue(index, rule, indicators);
            const target = rule.value === 'PRICE' ? currentPrice : rule.value;
            return this.compare(val, rule.operator, target);
        });
    }
    checkExitRules(index, currentPrice, rules, indicators) {
        if (rules.length === 0)
            return false;
        return rules.some(rule => {
            const val = this.getIndicatorValue(index, rule, indicators);
            const target = rule.value === 'PRICE' ? currentPrice : rule.value;
            return this.compare(val, rule.operator, target);
        });
    }
    getIndicatorValue(index, rule, indicators) {
        if (rule.indicator === 'MACD') {
            const macdRes = indicators['MACD_STD'];
            if (!macdRes)
                return 0;
            const offset = macdRes.length;
            const diff = 100000;
            const arr = macdRes;
            const realIndex = index - (100000);
            const key = `${rule.indicator}_${rule.period}`;
            const data = indicators[key] || indicators['MACD_STD'];
            if (!data)
                return 0;
            const period = rule.indicator === 'MACD' ? 26 : rule.period;
            const arrayIndex = index - period + 1;
            if (arrayIndex < 0 || arrayIndex >= data.length)
                return 0;
            if (rule.indicator === 'MACD')
                return data[arrayIndex]?.histogram || 0;
            return data[arrayIndex];
        }
        const key = `${rule.indicator}_${rule.period}`;
        const data = indicators[key];
        if (!data)
            return 0;
        const arrayIndex = index - rule.period;
        if (arrayIndex < 0)
            return 0;
        return data[arrayIndex];
    }
    compare(a, op, b) {
        switch (op) {
            case '<': return a < b;
            case '>': return a > b;
            case '=': return Math.abs(a - b) < 0.0001;
            default: return false;
        }
    }
};
exports.BacktestEngineService = BacktestEngineService;
exports.BacktestEngineService = BacktestEngineService = BacktestEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kline_entity_1.Kline)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], BacktestEngineService);


/***/ }),

/***/ "./apps/backtest-engine/src/entities/kline.entity.ts":
/*!***********************************************************!*\
  !*** ./apps/backtest-engine/src/entities/kline.entity.ts ***!
  \***********************************************************/
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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Kline = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Kline = class Kline {
};
exports.Kline = Kline;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Kline.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Kline.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Kline.prototype, "time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", String)
], Kline.prototype, "open", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", String)
], Kline.prototype, "high", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", String)
], Kline.prototype, "low", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", String)
], Kline.prototype, "close", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", String)
], Kline.prototype, "volume", void 0);
exports.Kline = Kline = __decorate([
    (0, typeorm_1.Entity)('klines_1m'),
    (0, typeorm_1.Index)(['symbol', 'time'], { unique: true })
], Kline);


/***/ }),

/***/ "./apps/data-collector/src/entities/kline.entity.ts":
/*!**********************************************************!*\
  !*** ./apps/data-collector/src/entities/kline.entity.ts ***!
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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Kline = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Kline = class Kline {
};
exports.Kline = Kline;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Kline.prototype, "time", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'text' }),
    __metadata("design:type", String)
], Kline.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], Kline.prototype, "open", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], Kline.prototype, "high", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], Kline.prototype, "low", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], Kline.prototype, "close", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], Kline.prototype, "volume", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Kline.prototype, "timestamp_ms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "avg_spread", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "rsi", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "macd_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "macd_signal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "macd_histogram", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "sma_20", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "ema_50", void 0);
exports.Kline = Kline = __decorate([
    (0, typeorm_1.Entity)({ name: 'klines_1m' })
], Kline);


/***/ }),

/***/ "./libs/technical-analysis/src/index.ts":
/*!**********************************************!*\
  !*** ./libs/technical-analysis/src/index.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./technical-analysis.module */ "./libs/technical-analysis/src/technical-analysis.module.ts"), exports);
__exportStar(__webpack_require__(/*! ./technical-analysis.service */ "./libs/technical-analysis/src/technical-analysis.service.ts"), exports);


/***/ }),

/***/ "./libs/technical-analysis/src/technical-analysis.module.ts":
/*!******************************************************************!*\
  !*** ./libs/technical-analysis/src/technical-analysis.module.ts ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TechnicalAnalysisModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const technical_analysis_service_1 = __webpack_require__(/*! ./technical-analysis.service */ "./libs/technical-analysis/src/technical-analysis.service.ts");
let TechnicalAnalysisModule = class TechnicalAnalysisModule {
};
exports.TechnicalAnalysisModule = TechnicalAnalysisModule;
exports.TechnicalAnalysisModule = TechnicalAnalysisModule = __decorate([
    (0, common_1.Module)({
        providers: [technical_analysis_service_1.TechnicalAnalysisService],
        exports: [technical_analysis_service_1.TechnicalAnalysisService],
    })
], TechnicalAnalysisModule);


/***/ }),

/***/ "./libs/technical-analysis/src/technical-analysis.service.ts":
/*!*******************************************************************!*\
  !*** ./libs/technical-analysis/src/technical-analysis.service.ts ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TechnicalAnalysisService = exports.INDICATOR_CONFIG = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const technicalindicators_1 = __webpack_require__(/*! technicalindicators */ "technicalindicators");
exports.INDICATOR_CONFIG = {
    RSI_PERIOD: 14,
    MACD_FAST: 12,
    MACD_SLOW: 26,
    MACD_SIGNAL: 9,
    SMA_PERIOD: 20,
    EMA_PERIOD: 50,
};
let TechnicalAnalysisService = class TechnicalAnalysisService {
    calculateIndicators(closePrices) {
        const result = {
            rsi: null,
            macd: null,
            sma: null,
            ema: null
        };
        if (closePrices.length > exports.INDICATOR_CONFIG.RSI_PERIOD) {
            const rsiResult = technicalindicators_1.RSI.calculate({
                values: closePrices,
                period: exports.INDICATOR_CONFIG.RSI_PERIOD
            });
            result.rsi = rsiResult.pop() || null;
        }
        if (closePrices.length > exports.INDICATOR_CONFIG.MACD_SLOW + exports.INDICATOR_CONFIG.MACD_SIGNAL) {
            const macdResult = technicalindicators_1.MACD.calculate({
                values: closePrices,
                fastPeriod: exports.INDICATOR_CONFIG.MACD_FAST,
                slowPeriod: exports.INDICATOR_CONFIG.MACD_SLOW,
                signalPeriod: exports.INDICATOR_CONFIG.MACD_SIGNAL,
                SimpleMAOscillator: false,
                SimpleMASignal: false
            });
            const lastMacd = macdResult.pop();
            if (lastMacd) {
                result.macd = {
                    value: lastMacd.MACD ?? 0,
                    signal: lastMacd.signal ?? 0,
                    histogram: lastMacd.histogram ?? 0
                };
            }
        }
        if (closePrices.length >= exports.INDICATOR_CONFIG.SMA_PERIOD) {
            const smaResult = technicalindicators_1.SMA.calculate({
                values: closePrices,
                period: exports.INDICATOR_CONFIG.SMA_PERIOD
            });
            result.sma = smaResult.pop() || null;
        }
        if (closePrices.length >= exports.INDICATOR_CONFIG.EMA_PERIOD) {
            const emaResult = technicalindicators_1.EMA.calculate({
                values: closePrices,
                period: exports.INDICATOR_CONFIG.EMA_PERIOD
            });
            result.ema = emaResult.pop() || null;
        }
        return result;
    }
};
exports.TechnicalAnalysisService = TechnicalAnalysisService;
exports.TechnicalAnalysisService = TechnicalAnalysisService = __decorate([
    (0, common_1.Injectable)()
], TechnicalAnalysisService);


/***/ }),

/***/ "@nestjs/bullmq":
/*!*********************************!*\
  !*** external "@nestjs/bullmq" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/bullmq");

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

/***/ "@nestjs/typeorm":
/*!**********************************!*\
  !*** external "@nestjs/typeorm" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("@nestjs/typeorm");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "technicalindicators":
/*!**************************************!*\
  !*** external "technicalindicators" ***!
  \**************************************/
/***/ ((module) => {

module.exports = require("technicalindicators");

/***/ }),

/***/ "typeorm":
/*!**************************!*\
  !*** external "typeorm" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("typeorm");

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
/*!******************************************!*\
  !*** ./apps/backtest-engine/src/main.ts ***!
  \******************************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const backtest_engine_module_1 = __webpack_require__(/*! ./backtest-engine.module */ "./apps/backtest-engine/src/backtest-engine.module.ts");
async function bootstrap() {
    const logger = new common_1.Logger('BacktestEngine');
    const app = await core_1.NestFactory.create(backtest_engine_module_1.BacktestEngineModule);
    const PORT = process.env.BACKTEST_PORT || 3002;
    await app.listen(PORT);
    logger.log(`🚀 Backtest Engine a correr na porta ${PORT}`);
}
bootstrap();

})();

/******/ })()
;