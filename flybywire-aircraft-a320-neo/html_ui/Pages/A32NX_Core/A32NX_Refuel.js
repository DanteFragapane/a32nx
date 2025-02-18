const WING_FUELRATE_GAL_SEC = 3.99;
const CENTER_MODIFIER = 3.0198;

class A32NX_Refuel {
    constructor() {}

    init() {
        console.log('A32NX_Refuel init');
        const totalFuelGallons = 6243;
        const fuelWeight = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilograms");
        const usingMetrics = SimVar.GetSimVarValue("L:A32NX_CONFIG_USING_METRIC_UNIT", "Number");
        const centerCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons");
        const LInnCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons");
        const LOutCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons");
        const RInnCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
        const ROutCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons");
        const total = Math.round(Math.max((LInnCurrentSimVar + (LOutCurrentSimVar) + (RInnCurrentSimVar) + (ROutCurrentSimVar) + (centerCurrentSimVar)), 0));
        const totalConverted = Math.round(total * fuelWeight * usingMetrics);
        SimVar.SetSimVarValue("L:A32NX_REFUEL_STARTED_BY_USR", "Bool", false);
        SimVar.SetSimVarValue("L:A32NX_FUEL_TOTAL_DESIRED", "Number", total);
        SimVar.SetSimVarValue("L:A32NX_FUEL_DESIRED", "Number", totalConverted);
        SimVar.SetSimVarValue("L:A32NX_FUEL_DESIRED_PERCENT", "Number", Math.round((total / totalFuelGallons) * 100));
        SimVar.SetSimVarValue("L:A32NX_FUEL_CENTER_DESIRED", "Number", centerCurrentSimVar);
        SimVar.SetSimVarValue("L:A32NX_FUEL_LEFT_MAIN_DESIRED", "Number", LInnCurrentSimVar);
        SimVar.SetSimVarValue("L:A32NX_FUEL_LEFT_AUX_DESIRED", "Number", LOutCurrentSimVar);
        SimVar.SetSimVarValue("L:A32NX_FUEL_RIGHT_MAIN_DESIRED", "Number", RInnCurrentSimVar);
        SimVar.SetSimVarValue("L:A32NX_FUEL_RIGHT_AUX_DESIRED", "Number", ROutCurrentSimVar);
    }

    defuelTank(multiplier) {
        return -WING_FUELRATE_GAL_SEC * multiplier;
    }
    refuelTank(multiplier) {
        return WING_FUELRATE_GAL_SEC * multiplier;
    }

    update(_deltaTime) {
        const refuelStartedByUser = SimVar.GetSimVarValue("L:A32NX_REFUEL_STARTED_BY_USR", "Bool");
        if (!refuelStartedByUser) {
            return;
        }
        const busDC2 = SimVar.GetSimVarValue("L:A32NX_ELEC_DC_2_BUS_IS_POWERED", "Bool");
        const busDCHot1 = SimVar.GetSimVarValue("L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED", "Bool");
        const gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
        const onGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");
        const eng1Running = SimVar.GetSimVarValue("ENG COMBUSTION:1", "Bool");
        const eng2Running = SimVar.GetSimVarValue("ENG COMBUSTION:2", "Bool");
        if (!onGround || eng1Running || eng2Running || gs > 0.1 || (!busDC2 && !busDCHot1)) {
            return;
        }
        const refuelRate = SimVar.GetSimVarValue("L:A32NX_REFUEL_RATE_SETTING", "Number");
        const centerTargetSimVar = SimVar.GetSimVarValue("L:A32NX_FUEL_CENTER_DESIRED", "Number");
        const LInnTargetSimVar = SimVar.GetSimVarValue("L:A32NX_FUEL_LEFT_MAIN_DESIRED", "Number");
        const LOutTargetSimVar = SimVar.GetSimVarValue("L:A32NX_FUEL_LEFT_AUX_DESIRED", "Number");
        const RInnTargetSimVar = SimVar.GetSimVarValue("L:A32NX_FUEL_RIGHT_MAIN_DESIRED", "Number");
        const ROutTargetSimVar = SimVar.GetSimVarValue("L:A32NX_FUEL_RIGHT_AUX_DESIRED", "Number");
        const centerCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons");
        const LInnCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons");
        const LOutCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons");
        const RInnCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
        const ROutCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons");
        let centerCurrent = centerCurrentSimVar + 6;
        let LInnCurrent = LInnCurrentSimVar + 7;
        let LOutCurrent = LOutCurrentSimVar + 1;
        let RInnCurrent = RInnCurrentSimVar + 7;
        let ROutCurrent = ROutCurrentSimVar + 1;
        const centerTarget = centerTargetSimVar + 6;
        const LInnTarget = LInnTargetSimVar + 7;
        const LOutTarget = LOutTargetSimVar + 1;
        const RInnTarget = RInnTargetSimVar + 7;
        const ROutTarget = ROutTargetSimVar + 1;
        if (refuelRate == 2) {
            SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", centerTarget);
            SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", LInnTarget);
            SimVar.SetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons", LOutTarget);
            SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", RInnTarget);
            SimVar.SetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons", ROutTarget);
            return;
        }
        let multiplier = 1;
        if (refuelRate == 1) {
            multiplier = 5;
        }
        multiplier *= _deltaTime / 1000;
        //DEFUELING (center tank first, then main, then aux)
        if (centerCurrent > centerTarget) {
            centerCurrent += this.defuelTank(multiplier) * CENTER_MODIFIER;
            if (centerCurrent < centerTarget) {
                centerCurrent = centerTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", centerCurrent);
            if (centerCurrent != centerTarget) {
                return;
            }
        }
        if (LInnCurrent > LInnTarget || RInnCurrent > RInnTarget) {
            LInnCurrent += this.defuelTank(multiplier) / 2;
            RInnCurrent += this.defuelTank(multiplier) / 2;
            if (LInnCurrent < LInnTarget) {
                LInnCurrent = LInnTarget;
            }
            if (RInnCurrent < RInnTarget) {
                RInnCurrent = RInnTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", RInnCurrent);
            SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", LInnCurrent);
            if (LInnCurrent != LInnTarget || RInnCurrent != RInnTarget) {
                return;
            }
        }
        if (LOutCurrent > LOutTarget || ROutCurrent > ROutTarget) {
            LOutCurrent += this.defuelTank(multiplier) / 2;
            ROutCurrent += this.defuelTank(multiplier) / 2;
            if (LOutCurrent < LOutTarget) {
                LOutCurrent = LOutTarget;
            }
            if (ROutCurrent < ROutTarget) {
                ROutCurrent = ROutTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons", ROutCurrent);
            SimVar.SetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons", LOutCurrent);
            if (LOutCurrent != LOutTarget || ROutCurrent != ROutTarget) {
                return;
            }
        }
        // REFUELING (aux first, then main, then center tank)
        if (LOutCurrent < LOutTarget || ROutCurrent < ROutTarget) {
            LOutCurrent += this.refuelTank(multiplier) / 2;
            ROutCurrent += this.refuelTank(multiplier) / 2;
            if (LOutCurrent > LOutTarget) {
                LOutCurrent = LOutTarget;
            }
            if (ROutCurrent > ROutTarget) {
                ROutCurrent = ROutTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons", ROutCurrent);
            SimVar.SetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons", LOutCurrent);
            if (LOutCurrent != LOutTarget || ROutCurrent != ROutTarget) {
                return;
            }
        }
        if (LInnCurrent < LInnTarget || RInnCurrent < RInnTarget) {
            LInnCurrent += this.refuelTank(multiplier) / 2;
            RInnCurrent += this.refuelTank(multiplier) / 2;
            if (LInnCurrent > LInnTarget) {
                LInnCurrent = LInnTarget;
            }
            if (RInnCurrent > RInnTarget) {
                RInnCurrent = RInnTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", RInnCurrent);
            SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", LInnCurrent);
            if (LInnCurrent != LInnTarget || RInnCurrent != RInnTarget) {
                return;
            }
        }
        if (centerCurrent < centerTarget) {
            centerCurrent += this.refuelTank(multiplier) * CENTER_MODIFIER;
            if (centerCurrent > centerTarget) {
                centerCurrent = centerTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", centerCurrent);
            if (centerCurrent != centerTarget) {
                return;
            }
        }
    }
}
