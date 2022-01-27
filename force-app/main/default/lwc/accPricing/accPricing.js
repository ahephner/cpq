import { LightningElement, api, track } from 'lwc';

export default class AccPricing extends LightningElement {
    @track toUpdate;
    loaded; 
    items; 
    levelOne;
    lOneLabel;
    lTwoLabel;
    section = '';
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
    //Hard Code for example 
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
        console.log('call back')
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
        console.log(JSON.stringify(this.toUpdate));
        
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
                this.toUpdate[i].difOne = this.roundNum(this.toUpdate[i].Level_1_Price__c - this.toUpdate[i].bLevOne, 2);
                this.toUpdate[i].difTwo = this.roundNum(this.toUpdate[i].Level_2_Price__c - this.toUpdate[i].bLevTwo,2);
                this.toUpdate[i].warnOne = (this.toUpdate[i].Level_1_Price__c - this.toUpdate[i].bLevOne)<0 ? 'slds-text-color_error' : 'slds-text-color_success';
                this.toUpdate[i].warnTwo = (this.toUpdate[i].Level_2_Price__c - this.toUpdate[i].bLevTwo)<0 ? 'slds-text-color_error' : 'slds-text-color_success';
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

//WORKING ON TOUCH EVENTS
    showInfo = false;

    ontouch(){
        let x = this.template.querySelectorAll('.pcCard').name;
        this.showInfo = false;
        console.log('x '+x);
        
    }
}