//Math for flow only!
import { LightningElement, api, track } from 'lwc';
import { FlowNavigationNextEvent, FlowNavigationBackEvent,FlowAttributeChangeEvent  } from 'lightning/flowSupport';
import { updateRecord} from 'lightning/uiRecordApi';
export default class ProductMaintFlowMath extends LightningElement {
    @track toUpdate;
    loaded; 
    items; 
    levelOne;
    name; 
    @track updatedRecords= [];
    beforePricing = [];
    badRecords = [];
    agencyCount = 0;
    badRecordCount = 0;
    updatedRecordCount =0;
    beforeLevel1;
    beforeLevel2;
    afterPriceLevel1;
    afterPriceLevel2;
    defLevel1;
    defLevel2;
    badRec = false; 
    @api label; 
    @api levTwoMarg;
    @api
    get levOneMarg(){
        return this.levelOne;
    }
    set levOneMarg(data){
        this.levelOne = data;
    }
    @api
    get defaultMarProd(){
        return this.items;
    }
    set defaultMarProd(data){
        this.items = data;
    }
    connectedCallback(){
        this.setValues();
    }

    setValues(){
        let bLevOne;
        let bLevTwo;
        let difOne;
        let difTwo; 
        let warnOne;
        let warnTwo;  
        //need to make a shallow copy
        this.toUpdate = this.items.map(el =>{
            bLevOne = el.Level_1_Price__c;
            bLevTwo = el.Level_2_Price__c;
            difOne;
            difTwo;
            warnOne;
            warnTwo; 
            return {...el, bLevOne, bLevTwo, difOne, difTwo, warnOne, warnTwo}
        })
        //console.log(JSON.stringify(this.toUpdate));
        
        for(let i=0; i<this.toUpdate.length; i++){
            if(this.toUpdate[i].Agency_Product__c){
                //console.log('agency '+this.toUpdate[i].Name);
                this.agencyCount ++; 
            }else if(this.toUpdate[i].Product_Cost__c >0 && this.toUpdate[i].Agency_Product__c===false){
                this.updatedRecordCount ++; 
                let before ={...this.toUpdate[i]}
                this.beforePricing.push(before);
                this.toUpdate[i].Level_1_Price__c = this.roundNum(this.toUpdate[i].Product_Cost__c /(1- this.levelOne/100),2);
                this.toUpdate[i].Level_2_Price__c = this.roundNum(this.toUpdate[i].Product_Cost__c /(1- this.levTwoMarg/100),2);
                this.toUpdate[i].difOne = this.roundNum(this.toUpdate[i].Level_1_Price__c - this.toUpdate[i].bLevOne, 2);
                this.toUpdate[i].difTwo = this.roundNum(this.toUpdate[i].Level_2_Price__c - this.toUpdate[i].bLevTwo,2);
                this.toUpdate[i].warnOne = (this.toUpdate[i].Level_1_Price__c - this.toUpdate[i].bLevOne)<0 ? 'slds-text-color_error' : 'slds-text-color_success';
                this.toUpdate[i].warnTwo = (this.toUpdate[i].Level_2_Price__c - this.toUpdate[i].bLevTwo)<0 ? 'slds-text-color_error' : 'slds-text-color_success';
                this.updatedRecords.push(this.toUpdate[i]);
            }
            else if(this.toUpdate[i].Product_Cost__c <=0 ||this.toUpdate[i].Product_Cost__c === undefined){
                //console.log('bad ' +this.toUpdate[i].Name);
                let name = this.toUpdate[i].Name;
                this.badRecords.push(name);
                this.badRecordCount ++;
                this.badRec = true; 
            }
        }
        console.log('before');
        console.log(JSON.stringify(this.beforePricing));
        
        console.log('after')
        console.log(JSON.stringify(this.updatedRecords))

        this.afterPriceLevel1 = this.roundNum(this.updatedRecords.reduce((total,next)=>total + next.Level_1_Price__c,0)/this.updatedRecords.length,2);
        this.afterPriceLevel2 = this.roundNum(this.updatedRecords.reduce((total,next)=>total + next.Level_2_Price__c,0)/this.updatedRecords.length,2);
        this.beforeLevel1 = this.roundNum(this.beforePricing.reduce((total,next)=>total + next.Level_1_Price__c,0)/this.beforePricing.length,2);
        this.beforeLevel2 = this.roundNum(this.beforePricing.reduce((total,next)=>total + next.Level_2_Price__c,0)/this.beforePricing.length,2);
        this.defLevel1 = this.roundNum(this.afterPriceLevel1 - this.beforeLevel1,2);
        this.defLevel2 = this.roundNum(this.afterPriceLevel2 - this.beforeLevel2,2);

    }

    save(){
        this.loaded = false; 
        const inputs = this.updatedRecords.slice().map(draft=>{
            let Id = draft.Id
            let Level_1_Price__c = draft.Level_1_Price__c
            let Level_2_Price__c = draft.Level_2_Price__c

            const fields = {Id, Level_1_Price__c, Level_2_Price__c}
            return {fields}
        })
        console.log(inputs);
        const promises = inputs.map(rec =>updateRecord(rec));
        Promise.all(promises).then(x=>{
            let mess = 'success';
            const attributeChange = new FlowAttributeChangeEvent('label', mess);
             this.dispatchEvent(attributeChange);
             this.next(); 
        }).catch(err=>{
            this.error = err;
            const attributeChange = new FlowAttributeChangeEvent('label', this.error);
            this.dispatchEvent(attributeChange)
        }).finally(()=>{
            this.loaded = true; 
        })
        
    }
    next(){
        const moveNext = new FlowNavigationNextEvent();
        this.dispatchEvent(moveNext);
    }
    back(){
        const moveBack = new FlowNavigationBackEvent();
        this.dispatchEvent(moveBack); 
    }
//returns a round number for later math functions
    roundNum = (value, dec)=>{
        //console.log('v '+value+' dec '+dec)
        return Number(Math.round(parseFloat(value+'e'+dec))+'e-'+dec)
    }
        //remove row
    removeRow(e){
        let index = this.updatedRecords.findIndex(x=> x.Id === e.target.name);
        if(index>0){
            this.updatedRecords.splice(index,1);     
        }        
    }
}