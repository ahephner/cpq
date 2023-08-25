import { LightningElement, api, track } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { updateRecord } from 'lightning/uiRecordApi';
import { FlowNavigationNextEvent, FlowNavigationBackEvent,FlowAttributeChangeEvent  } from 'lightning/flowSupport';
import { checkPricing } from 'c/helper';
export default class ProductMaintFlow extends LightningElement{
   @track items;  
   @track twoItems;
    itemData
    loaded = false;
    formSize;
    error;  
    goodPricing = true;  
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
        
        this.twoItems = this.screenSize(FORM_FACTOR) ? this.items : '';
    }

    setMargins(){
        this.items = this.itemData.map(i=>{
            let rowClass;  
            let goodPrice;   
           let x = {...i}
            x.Level_1_Editable_Margin__c = i.Agency_Product__c ? '' : i.Level_1_Editable_Margin__c;
            x.Level_2_Editable_Margin__c = i.Agency_Product__c ? '' : i.Level_2_Editable_Margin__c;
            console.log(i.Early_Order__c); 

            rowClass = 'innerInfo';
            goodPrice = true; 
            return {...x, rowClass, goodPrice};
        }) 
        this.flipBox(this.items[0].Id);
        this.twoItems = this.screenSize(FORM_FACTOR) ? this.items : '';        
    }

    flipBox(firstItem){
        let index = this.items.findIndex(x => firstItem === x.Id)
        this.items[index].rowClass = 'first'
    }

    changeOne(p){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === p.target.name);
        //console.log('index '+index);
        let targetName = p.target.name; 
        this.delay = setTimeout(()=>{
            this.items[index].Level_1_Price__c = Number(p.detail.value);
            
            if(this.items[index].Level_1_Price__c > 0){
                this.items[index].Level_1_Editable_Margin__c = Number((1 - (this.items[index].Product_Cost__c /this.items[index].Level_1_Price__c))*100).toFixed(2);
                this.items[index].isChanged__c = true;
            }
            let levelOne = this.items[index].Level_1_Price__c;
            let floor = this.items[index].Floor_Price__c;
            this.handleWarningOne(targetName, levelOne, floor, index);
        }, 500)         
    }
    changeTwo(p){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === p.target.name);
        
        let targetName = p.target.name; 
        this.delay = setTimeout(()=>{
            this.items[index].Level_2_Price__c = Number(p.detail.value);
            if(this.items[index].Level_2_Price__c > 0){
                this.items[index].Level_2_Editable_Margin__c = Number((1 - (this.items[index].Product_Cost__c /this.items[index].Level_2_Price__c))*100).toFixed(2);
                this.items[index].isChanged__c = true;
            }
            let levelTwo = this.items[index].Level_2_Price__c;
            let floor = this.items[index].Floor_Price__c;
            this.handleWarningTwo(targetName, levelTwo, floor, index)
        }, 500)  
    }
    changeMarOne(m){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === m.target.name);
        let targetName = m.target.name; 
        this.delay = setTimeout(()=>{
            this.items[index].Level_1_Editable_Margin__c = Number(m.detail.value);
            //console.log(this.items[index].levOneMar);
            
            if(this.items[index].Level_1_Editable_Margin__c > 0){
                this.items[index].Level_1_Price__c = Number(this.items[index].Product_Cost__c /(1- this.items[index].Level_1_Editable_Margin__c/100)).toFixed(2);
                this.items[index].isChanged__c = true;
            }
            let levelOne = this.items[index].Level_1_Price__c
            let floor = this.items[index].Floor_Price__c;
            this.handleWarningOne(targetName, levelOne, floor, index);
        }, 500)
    }
    changeMarTwo(m){
        window.clearTimeout(this.delay);
        let index = this.items.findIndex(prod => prod.Id === m.target.name);
        let targetName = m.target.name; 
        this.delay = setTimeout(()=>{
            this.items[index].Level_2_Editable_Margin__c = Number(m.detail.value);
           // console.log(1, this.items[index].Level_2_Editable_Margin__c )
            //console.log(2, this.items[index].Product_Cost__c)
            if(this.items[index].Level_2_Editable_Margin__c > 0){
                this.items[index].Level_2_Price__c = Number(this.items[index].Product_Cost__c /(1- this.items[index].Level_2_Editable_Margin__c/100)).toFixed(2);
                this.items[index].isChanged__c = true;
            }
            let levelTwo = this.items[index].Level_2_Price__c;
            let floor = this.items[index].Floor_Price__c;
            this.handleWarningTwo(targetName, levelTwo, floor, index)
        }, 500)
    }
    eopPriceBook(m){
        let index = this.items.findIndex(prod => prod.Id === m.target.name);
        this.items[index].isChanged__c = true;
        this.items[index].Early_Order__c = m.target.checked; 
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
        const productInputs = this.items.slice().map(draft=>{
            let Id = draft.Product2Id;
            let Early_Order__c = draft.Early_Order__c; 

            const fields = {Id, Early_Order__c}
            return {fields}; 
        })
        console.log(JSON.stringify(productInputs));
        console.log('promise 1');
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        //here if you want to update the product card
        const promise2 = productInputs.map(ri => updateRecord(ri));
       //If you want to add another promise use this ==> [promises, promise2]
        Promise.all([promises, promise2]).then(prod => {
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

    handleWarningOne = (targ, lev, flr, ind)=>{
        console.log(1,lev, 2, flr, 3, ind);
        
        if(lev > flr){
            this.template.querySelector(`[data-oneprice="${targ}"]`).style.color ="black";
            this.template.querySelector(`[data-onemargin="${targ}"]`).style.color ="black";
            this.items[ind].goodPrice = true; 
            this.goodPricing = checkPricing(this.items);
           
        }else if(lev === flr){
            this.template.querySelector(`[data-oneprice="${targ}"]`).style.color ="orange";
            this.template.querySelector(`[data-onemargin="${targ}"]`).style.color ="orange";
            this.items[ind].goodPrice = true;
            this.goodPricing = checkPricing(this.items);
            
        }else if(lev<flr){
            this.template.querySelector(`[data-oneprice="${targ}"]`).style.color ="red";
            this.template.querySelector(`[data-onemargin="${targ}"]`).style.color ="red";
            this.items[ind].goodPrice = false;
            this.goodPricing = checkPricing(this.items);
             
        }
    }
    //this.handleWarningTwo(targetName, levelTwo, floor, index)
    handleWarningTwo = (targ, lev, flr, ind)=>{
        //console.log(1,lev, 2, flr, 3, ind);
        
        if(lev > flr){
            this.template.querySelector(`[data-twoprice="${targ}"]`).style.color ="black";
            this.template.querySelector(`[data-twomargin="${targ}"]`).style.color ="black";
            this.items[ind].goodPrice = true; 
            this.goodPricing = checkPricing(this.items);
           
        }else if(lev === flr){
            this.template.querySelector(`[data-twoprice="${targ}"]`).style.color ="orange";
            this.template.querySelector(`[data-twomargin="${targ}"]`).style.color ="orange";
            console.log(1,this.items[ind].goodPrice)
            this.items[ind].goodPrice = true;
            console.log(2,this.items[ind].goodPrice)
            this.goodPricing = checkPricing(this.items);
            
        }else if(lev<flr){
            this.template.querySelector(`[data-twoprice="${targ}"]`).style.color ="red";
            this.template.querySelector(`[data-twomargin="${targ}"]`).style.color ="red";
            this.items[ind].goodPrice = false;
            this.goodPricing = checkPricing(this.items);
             
        }
    }
}