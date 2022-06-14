import { LightningElement, api, track } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { updateRecord } from 'lightning/uiRecordApi';
import { FlowNavigationNextEvent, FlowNavigationBackEvent,FlowAttributeChangeEvent  } from 'lightning/flowSupport';
export default class ProductMaintFlow extends LightningElement{
   @track items;  
   @track twoItems;
    itemData
    loaded = false;
    formSize;
    error;  
    @api flexipageRegionWidth;
    @api message; 

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

    setWindow(){
        this.items = this.itemData.map(i=>{
            i.Level_1_Editable_Margin__c = i.Agency_Product__c ? '' : i.Level_1_Editable_Margin__c;
            return {...i}
        }); 
        console.log(JSON.stringify(this.items))
        this.twoItems = this.screenSize(FORM_FACTOR) ? this.items : '';
    }

    setMargins(){
        
        let levOneMar;
        let levTwoMar;
        this.items = this.itemData.map(i=>{
            let rowClass    
            x = {...i}
            x.Level_1_Editable_Margin__c = i.Agency_Product__c ? '' : i.Level_1_Editable_Margin__c;
            x.Level_2_Editable_Margin__c = i.Agency_Product__c ? '' : i.Level_2_Editable_Margin__c;
            rowClass = 'innerInfo';
            return {...x, rowClass};
        }) 
        this.flipBox(this.items[0].Id);
        this.twoItems = this.screenSize(FORM_FACTOR) ? this.items : ''; 
        
        //console.log(this.twoItems);
                
    }

    flipBox(firstItem){
        let index = this.items.findIndex(x => firstItem === x.Id)
        console.log({index})
        this.items[index].rowClass = 'first'
        //this.template.querySelector(`.${firstItem}`);
       
        //this.template.querySelector(`[data-id="${firstItem}"]`).classList.add('first');
    }

    changeOne(p){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === p.target.name);
        //console.log('index '+index);
        
        this.delay = setTimeout(()=>{
            this.items[index].Level_1_Price__c = Number(p.detail.value);
            
            if(this.items[index].Level_1_Price__c > 0){
                this.items[index].Level_1_Editable_Margin__c = Number((1 - (this.items[index].Product_Cost__c /this.items[index].Level_1_Price__c))*100).toFixed(2);
                this.items[index].isChanged__c = true;
            }

        }, 500)         
    }
    changeTwo(p){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === p.target.name);
        this.delay = setTimeout(()=>{
            this.items[index].Level_2_Price__c = Number(p.detail.value);
            if(this.items[index].Level_2_Price__c > 0){
                this.items[index].Level_2_Editable_Margin__c = Number((1 - (this.items[index].Product_Cost__c /this.items[index].Level_2_Price__c))*100).toFixed(2);
                this.items[index].isChanged__c = true;
            }

        }, 500)  
    }
    changeMarOne(m){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === m.target.name);
        this.delay = setTimeout(()=>{
            this.items[index].Level_1_Editable_Margin__c = Number(m.detail.value);
            //console.log(this.items[index].levOneMar);
            
            if(this.items[index].Level_1_Editable_Margin__c > 0){
                this.items[index].Level_1_Price__c = Number(this.items[index].Product_Cost__c /(1- this.items[index].Level_1_Editable_Margin__c/100)).toFixed(2);
                this.items[index].isChanged__c = true;
            }

        }, 500)
    }
    changeMarTwo(m){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === m.target.name);
        this.delay = setTimeout(()=>{
            this.items[index].Level_2_Editable_Margin__c = Number(m.detail.value);
            if(this.items[index].Level_2_Editable_Margin__c > 0){
                this.items[index].Level_2_Price__c = Number(this.items[index].Product_Cost__c /(1- this.items[index].Level_2_Editable_Margin__c/100)).toFixed(2);
                this.items[index].isChanged__c = true;
            }

        }, 500)
    }

    handleSave(){
        this.loaded = false;
        
        const recordInputs = this.items.slice().map(draft=>{
            let Id = draft.Id;
            let Level_1_Price__c = draft.Level_1_Price__c;
            let Level_2_Price__c = draft.Level_2_Price__c;
            let Level_1_Editable_Margin__c = draft.Level_1_Editable_Margin__c
            let Level_2_Editable_Margin__c = draft.Level_2_Editable_Margin__c
            let isChanged__c = draft.isChanged__c; 
            const fields = {Id, Level_1_Price__c, Level_2_Price__c, Level_1_Editable_Margin__c, Level_2_Editable_Margin__c,isChanged__c };
    
            return {fields};
        })
        //here update product2
        // const productInputs = this.items.slice().map(draft=>{
        //     let Id = draft.Product2_Real_Id__c;
        //     let Floor_Price__c = draft.Floor_Price__c;

        //     const fields = {Id, Floor_Price__c}
        //     return {fields}; 
        // })
        //console.log(JSON.stringify(productInputs));
        //console.log('promise 1');
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        //here if you want to update the product card
       // const promise2 = productInputs.map(ri => updateRecord(ri));
       //If you want to add another promise use this ==> [promises, promise2]
        Promise.all(promises).then(prod => {
            console.log(prod);
        }).catch(error => {
            console.log(error);
        }).finally(() => {
            this.draftValues = []; 
            this.loaded = true;
        });  
    } 

    handleSaveMobile(){
        this.loaded = false;
        
        const recordInputs = this.items.slice().map(draft=>{
            let Id = draft.Id;
            let Floor_Price__c = draft.Floor_Price__c;
            let Level_1_Price__c = draft.Level_1_Price__c;
            let Level_2_Price__c = draft.Level_2_Price__c;
            
            const fields = {Id, Level_1_Price__c, Level_2_Price__c};

            return {fields};
        })
        console.log(JSON.stringify(recordInputs));
        
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(prod => {
            let mess = 'success';
            const attributeChange = new FlowAttributeChangeEvent('message', mess);
            this.dispatchEvent(attributeChange);
            this.next(); 
        }).catch(err => {
            this.error = err;
            const attributeChange = new FlowAttributeChangeEvent('message', this.error);
            this.dispatchEvent(attributeChange)
 
        }).finally(() => {
            console.log('finally');
            
            this.draftValues = []; 
            this.loaded = true;
            
        });  
    } 
    next(){
        const moveNext = new FlowNavigationNextEvent();
        this.dispatchEvent(moveNext);
    }
    goBack(){
        const moveBack = new FlowNavigationBackEvent();
        this.dispatchEvent(moveBack); 
    }
}