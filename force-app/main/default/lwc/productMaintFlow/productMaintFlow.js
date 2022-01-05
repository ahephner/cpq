import { LightningElement, api, track } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { updateRecord } from 'lightning/uiRecordApi';
export default class ProductMaintFlow extends LightningElement{
   @track items;  
    itemData
    loaded = false;
    formSize; 
    @api flexipageRegionWidth;

    @api
    get priceItems(){
        return this.itemData || [];
    }

    set priceItems(data){
        this.itemData = data;
        this.setMargins(); 
    }

    connectedCallback(){
        this.formSize = this.screenSize(FORM_FACTOR);
        this.loaded = true; 
    }
    //check screen size to show table on desktop and cards on mobile
    screenSize = (screen) => {
        return screen === 'Large'? true : false
    }

    setMargins(){
        console.log('setMargins');
        let levOneMar;
        let levTwoMar;
        this.items = this.itemData.map(i=>{
            levOneMar = (((i.Level_1_Price__c - i.UnitPrice)/i.Level_1_Price__c)*100).toFixed(2);
            levTwoMar = (((i.Level_2_Price__c - i.UnitPrice)/i.Level_2_Price__c)*100).toFixed(2);
            return {...i, levOneMar, levTwoMar};
        })
    }



    //handle pricing changes
    newUnitPrice(p){
        window.clearTimeout(this.delay);
        let index = this.itemData.findIndex(prod => prod.Id === p.target.name);
        this.delay = setTimeout(()=>{
            this.itemData[index].UnitPrice = Number(e.detail.value);
            
            // if(this.itemData[index].UnitPrice > 0){
            //     this.itemData[index].CPQ_Margin__c = Number((1 - (this.selection[index].Cost__c /this.selection[index].UnitPrice))*100).toFixed(2);
            // }

        }, 500)       
    }
    changeOne(p){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === p.target.name);
        console.log('index '+index);
        
        this.delay = setTimeout(()=>{
            this.items[index].Level_1_Price__c = Number(p.detail.value);
            
            if(this.items[index].Level_1_Price__c > 0){
                this.items[index].levOneMar = Number((1 - (this.items[index].UnitPrice /this.items[index].Level_1_Price__c))*100).toFixed(2);
            }

        }, 500)         
    }
    changeTwo(p){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === p.target.name);
        this.delay = setTimeout(()=>{
            this.items[index].Level_2_Price__c = Number(p.detail.value);
            if(this.items[index].Level_2_Price__c > 0){
                this.items[index].levTwoMar = Number((1 - (this.items[index].UnitPrice /this.items[index].Level_2_Price__c))*100).toFixed(2);
            }

        }, 500)  
    }
    changeMarOne(m){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === m.target.name);
        this.delay = setTimeout(()=>{
            this.items[index].levOneMar = Number(m.detail.value);
            console.log(this.items[index].levOneMar);
            
            if(this.items[index].levOneMar > 0){
                this.items[index].Level_1_Price__c = Number(this.items[index].UnitPrice /(1- this.items[index].levOneMar/100)).toFixed(2);
            }

        }, 500)
    }
    changeMarTwo(m){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === m.target.name);
        this.delay = setTimeout(()=>{
            this.items[index].levTwoMar = Number(m.detail.value);
            if(this.items[index].levTwoMar > 0){
                this.items[index].Level_2_Price__c = Number(this.items[index].UnitPrice /(1- this.items[index].levTwoMar/100)).toFixed(2);
            }

        }, 500)
    }

    handleSave(){
        this.loaded = false;
        
        const recordInputs = this.items.slice().map(draft=>{
            let Id = draft.Id;
            let UnitPrice = draft.UnitPrice;
            let Level_1_Price__c = draft.Level_1_Price__c;
            let Level_2_Price__c = draft.Level_2_Price__c;
            
            const fields = {Id,UnitPrice, Level_1_Price__c, Level_2_Price__c};

            return {fields};
        })
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(prod => {
                console.log(prod);
        }).catch(error => {
            console.log(error);
            
            
        }).finally(() => {
            console.log('finally');
            
            this.draftValues = []; 
            this.loaded = true;
            
        });  
    } 
    
}