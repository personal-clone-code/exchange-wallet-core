"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignerFactory = void 0;
var CollectingSigner_1 = require("./CollectingSigner");
var WithdrawalSigner_1 = require("./WithdrawalSigner");
var SeedingSigner_1 = require("./SeedingSigner");
var WithdrawalCollectSigner_1 = require("./WithdrawalCollectSigner");
var SignerFactory = (function () {
    function SignerFactory() {
    }
    SignerFactory.getSigner = function (localTx) {
        if (localTx.isSeedTx()) {
            return new SeedingSigner_1.SeedingSigner(localTx);
        }
        else if (localTx.isWithdrawal()) {
            return new WithdrawalSigner_1.WithdrawalSigner(localTx);
        }
        else if (localTx.isCollectTx()) {
            return new CollectingSigner_1.CollectingSigner(localTx);
        }
        else if (localTx.isWithdrawalCollect) {
            return new WithdrawalCollectSigner_1.WithdrawalCollectSigner(localTx);
        }
        throw new Error('Not support signer for localTxType: ' + localTx.type);
    };
    return SignerFactory;
}());
exports.SignerFactory = SignerFactory;
//# sourceMappingURL=SignerFactory.js.map