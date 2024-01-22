import { LightningElement, api, track } from 'lwc';
import getProducts from '@salesforce/apex/cpqApex.getProducts';
import {roundNum} from 'c/helper';
import FORM_FACTOR from '@salesforce/client/formFactor';
export default class ConfirmationScreen extends LightningElement {
    @api rec; 
    @api info; 
    @track prods = []
    totalPrice;
    avgMargin;
    totalUnits; 
    goodMargin;
    showDate;
    formSize; 
    connectedCallback(){
        console.log(this.info)
        this.init(); 
    }
//check screen size to show table on desktop and cards on mobile
screenSize = (screen) => {
    return screen === 'Large'? true : false  
}
    init(){
        getProducts({oppId: this.rec})
        .then((x)=>{
            
            let back  = [...x]; 
            this.prods = back.map(item=>{
               
                return {...item,
                    id: item.Id,
                    shortName: item.Product2.Name.length >31 ? item.Product2.Name.substring(0,30)+ '...' : item.Product2.Name,
                    mobileName: item.Product2.Name.length >25 ? item.Product2.Name.substring(0,25)+ '...' : item.Product2.Name,
                    unitPrice: item.CPQ_Unit_Price__c,
                    shownMargin: item.Product2.Agency_Pricing__c ? '' : item.CPQ_Margin__c,
                    marginCount: item.Product2.Agency_Pricing__c || item.Product2.Name.includes('SHIPPING') ? 0 : 1,
                    marginCal: item.Product2.Agency_Pricing__c || item.Product2.Name.includes('SHIPPING') ? 0 : item.CPQ_Margin__c, 
                    goodMargin: !item.Product2.Agency_Pricing__c && item.CPQ_Margin__c > 30 ? true : false
                    }
                
            }); 
            
        })
        .then(()=>{
            this.formSize = this.screenSize(FORM_FACTOR)
            let full = this.info.deliveryDate
            let year = full.substring(0,4);
            let month = full.substring(5,7);
            let day = full.substring(8,10); 
            this.showDate = `${month}-${day}-${year}`
            //console.log(1, this.showDate)
            if(this.prods){
                this.totalPrice = this.prods.reduce((a,b)=>a+b.TotalPrice,0)
                this.totalUnits = this.prods.reduce((a,b)=> a+b.Quantity, 0)
                let totalMarging = this.prods.reduce((a,b)=> a+b.marginCal, 0)
                let elMargin = this.prods.reduce((a,b)=> a+b.marginCount, 0)
                this.avgMargin = roundNum(totalMarging/elMargin,2); 
                this.goodMargin = this.avgMargin >= 30 ? true : false;
                this.greatmargin = this.avgMargin >=35 ? true : false; 
                this.fireMargin = this.avgMargin >= 42 ? true : false;  
            }
        }).catch((err)=>{
            console.log(JSON.stringify(err));
            console.log(err)
        })
    }
    handleConfirm(){
        this.dispatchEvent(new CustomEvent('close'));
    }
}