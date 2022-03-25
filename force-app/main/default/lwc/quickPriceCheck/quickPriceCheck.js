import { LightningElement,track,api } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import checkPrice from '@salesforce/apex/quickPriceSearch.getPricing'; 
export default class QuickPriceCheck extends LightningElement {
    @api flexipageRegionWidth;
    formSize; 
    searchTerm;
    priceBook = '01s410000077vSKAAY';
    @track prod = [];
    
    connectedCallback(){ 
        this.formSize = this.screenSize(FORM_FACTOR);
        console.log('formsize '+ this.formSize);
        
    }

    screenSize = (screen) => {
        return screen === 'Large'? true : false  
    }
    handleKeyUp(evt) {
        const isEnterKey = evt.keyCode === 13;
        if (isEnterKey) {
            this.searchTerm = evt.target.value;
            this.search(); 
        }
    }

    search(){
        console.log(this.flexipageRegionWidth)
        checkPrice({priceBookId: this.priceBook, searchKey: this.searchTerm})
        .then((res)=>{ 
            console.log(JSON.stringify(res))
                let name;
                let flr;
                let lev1;
                let lev2;
                let stock; 
                this.prod = res.map(x=>{
                    name= x.Product2.Name,
                    flr = x.Product2.Floor_Price__c,
                    lev1 = x.Level_1_UserView__c,
                    lev2 = x.Level_2_UserView__c,
                    stock = x.Product2.Product_Status__c
                    return {...x, name, flr, lev1, lev2, stock}
                })
        }).then(()=>{
            this.searchTerm = ''; 
            let x = this.template.querySelector('lightning-input').value;
            x = ''; 
            
        })
    }
}