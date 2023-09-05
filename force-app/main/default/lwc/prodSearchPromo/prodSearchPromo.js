import { LightningElement, api } from 'lwc';
import searchPromos from '@salesforce/apex/quickPriceSearch.searchPromos';
import onLoadPromos from '@salesforce/apex/quickPriceSearch.onLoadPromos';

import { uniqPromo, uniqVals} from 'c/tagHelper';
export default class ProdSearchPromo extends LightningElement{
    @api term; 
    loaded = true; 
    data; 
    dateNow = new Date();
    today = this.dateNow.getFullYear()+'-'+(this.dateNow.getMonth()+1)+'-'+this.dateNow.getDate();
    loadedBefore = false
    connectedCallback(){
      this.initLoad();
    }

    getFormattedDate(stringDateIn, stringDate2) {
        let date = new Date(stringDateIn)
        let date2 = new Date(stringDate2)
        let year = date.getFullYear();
        let month = (1 + date.getMonth()).toString().padStart(2, '0');
        let day = date.getDate().toString().padStart(2, '0');
        let prettyDate = month + '/' + day + '/' + year;
        let diff = Math.ceil(((date.getTime() - date2.getTime())/ (1000 * 3600 * 24))) -1;
        return {
                prettyDate,
                diff
        }
            }
    async initLoad(){
    
        if(!this.loadedBefore && this.data === undefined){
            
            this.loaded = false
            try {
                let pros = await onLoadPromos()
                let once = pros.length> 1 ? await uniqPromo(pros) : pros;

                    this.data = await once.map((item, index)=>({
                        ...item,
                        experDate: this.getFormattedDate(item.Search_Label__r.Expiration_Date__c, this.today).prettyDate,
                        experDays: this.getFormattedDate(item.Search_Label__r.Expiration_Date__c, this.today).diff,
                        btnName: "utility:add",
                        btnVariant: "brand",
                        dayClass: this.getFormattedDate(item.Search_Label__r.Expiration_Date__c, this.today).diff<= 7 ? 'redClass': '' 
                    }))
                this.loadedBefore =true; 
                this.loaded = true; 
                //console.log(JSON.stringify(this.data))
            } catch (error) {
                console.error(error)
            }
        }
    }
    @api
    async promoSearch(searchString){
        this.loaded = false
        try {
            let pros = await searchPromos({query:searchString})
           
                this.data = await pros.map((item, index)=>({
                    ...item,
                    experDate: this.getFormattedDate(item.Expiration_Date__c, this.today).prettyDate,
                    experDays: this.getFormattedDate(item.Expiration_Date__c, this.today).diff
                }))
            
            this.loaded = true; 
            console.log(JSON.stringify(this.data))
        } catch (error) {
            console.error(error)
        }
    }
//export get products add to order
    addPromo(e){
        const rowId = e.target.name; 
        this.dispatchEvent(new CustomEvent('promoid', {
            detail: rowId
        }))
        
    }
}