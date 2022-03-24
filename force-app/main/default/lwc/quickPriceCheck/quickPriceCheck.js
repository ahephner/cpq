import { LightningElement,track,api } from 'lwc';
import checkPrice from '@salesforce/apex/quickPriceSearch.getPricing'; 
export default class QuickPriceCheck extends LightningElement {
    @api flexipageRegionWidth;
    searchTerm;
    priceBook = '01s410000077vSKAAY';
    @track prod = []; 
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
                let name;
                let flr;
                let lev1;
                let lev2
                this.prod = res.map(x=>{
                    name= x.Product2.Name,
                    flr = x.Product2.Floor_Price__c,
                    lev1 = x.Level_1_UserView__c,
                    lev2 = x.Level_2_UserView__c
                    return {...x, name, flr, lev1, lev2}
                })
        }).then(()=>{
            this.searchTerm = ''; 
            let x = this.template.querySelector('lightning-input').value;
            x = ''; 
            
        })
    }
}