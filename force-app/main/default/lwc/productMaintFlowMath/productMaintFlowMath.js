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
    updatedRecords= [];
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
        //need to make a shallow copy
        this.toUpdate = this.items.map(el =>{
            return {...el}
        })
        //console.log(this.toUpdate);
        
        for(let i=0; i<this.toUpdate.length; i++){
            if(this.toUpdate[i].Agency_Product__c){
                console.log('agency '+this.toUpdate[i].Name);
                this.agencyCount ++; 
            }else if(this.toUpdate[i].UnitPrice >0 && this.toUpdate[i].Agency_Product__c===false){
                this.updatedRecordCount ++; 
                let before ={...this.toUpdate[i]}
               //console.log(typeof this.toUpdate[i])
                this.beforePricing.push(before);
                this.toUpdate[i].Level_1_Price__c = this.roundNum(this.toUpdate[i].UnitPrice /(1- this.levelOne/100),2)
                this.toUpdate[i].Level_2_Price__c = this.roundNum(this.toUpdate[i].UnitPrice /(1- this.levTwoMarg/100),2);
                //console.log(this.toUpdate[i].Name, this.toUpdate[i].Level_1_Price__c * this.levelOne)
                this.updatedRecords.push(this.toUpdate[i]);
            }
            else if(this.toUpdate[i].UnitPrice <=0 ||this.toUpdate[i].UnitPrice === undefined){
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
            const attributeChange = new FlowAttributeChangeEvent('label', mess);
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
}