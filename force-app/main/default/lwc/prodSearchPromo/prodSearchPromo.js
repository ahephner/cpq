import { LightningElement, api } from 'lwc';
import searchPromos from '@salesforce/apex/quickPriceSearch.searchPromos';
export default class ProdSearchPromo extends LightningElement{
    @api term; 
    loaded = true; 
    data; 
    dateNow = new Date();
    today = this.dateNow.getFullYear()+'-'+(this.dateNow.getMonth()+1)+'-'+this.dateNow.getDate();
    getFormattedDate(stringDateIn, stringDate2) {
        let date = new Date(stringDateIn)
        let date2 = new Date(stringDate2)
        let year = date.getFullYear();
        let month = (1 + date.getMonth()).toString().padStart(2, '0');
        let day = date.getDate().toString().padStart(2, '0');
        let prettyDate = month + '/' + day + '/' + year;
        let diff = ((date.getTime() - date2.getTime())/ (1000 * 3600 * 24))
        return {
                prettyDate,
                diff
        }
            }
    @api
    async promoSearch(searchString){
        this.loaded = false
        try {
            let pros = await searchPromos({query:searchString})
           debugger
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
}