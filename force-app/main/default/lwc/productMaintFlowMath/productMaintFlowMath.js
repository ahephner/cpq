//Math for flow only!
import { LightningElement, api, track } from 'lwc';

export default class ProductMaintFlowMath extends LightningElement {
    @track toUpdate;
    items; 
    levelOne;
    name; 
    updatedRecords= [];
    badRecords = [];
    agencyCount = 0;
    badRecordCount = 0;
    updatedRecordCount =0;
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
    average = (array) => array.reduce((a, b) => a + b) / array.length;
    setValues(){
        //need to make a shallow copy
        this.toUpdate = this.items.map(el =>{
            return {...el}
        })
        
        for(let i=0; i<this.toUpdate.length; i++){
            if(this.toUpdate[i].Agency_Product__c){
                console.log('agency '+this.toUpdate[i].Name);
                this.agencyCount ++; 
            }else if(this.toUpdate[i].UnitPrice >0){
                this.updatedRecordCount ++; 
                this.toUpdate[i].Level_1_Price__c = Number(this.toUpdate[i].UnitPrice /(1- this.levelOne/100)).toFixed(2);
                this.toUpdate[i].Level_2_Price__c = Number(this.toUpdate[i].UnitPrice /(1- this.levTwoMarg/100)).toFixed(2);
                //console.log(this.toUpdate[i].Name, this.toUpdate[i].Level_1_Price__c * this.levelOne)
                this.updatedRecords.push(this.toUpdate[1]);
            }
            else if(this.toUpdate[i].UnitPrice <=0 ||this.toUpdate[i].UnitPrice === undefined){
                //console.log('bad ' +this.toUpdate[i].Name);
                let name = this.toUpdate[i].Name;
                this.badRecords.push(name);
                this.badRecordCount ++;
            }
        }
        console.log('updated record count '+this.updatedRecordCount);
        console.log('updated records '+ JSON.stringify(this.updatedRecords));
        console.log('agency count '+this.agencyCount);
        console.log('bad record count '+this.badRecordCount);
        console.log('bad record names '+this.badRecords);
    }
}