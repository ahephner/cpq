import { LightningElement, api, track } from 'lwc';
import getProducts from '@salesforce/apex/cpqApex.getProducts';
import {roundNum} from 'c/helper'
export default class ConfirmationScreen extends LightningElement {
    @api rec; 
    @api info; 
    @track prods = []
    totalPrice;
    avgMargin;
    totalUnits; 
    goodMargin;
    showDate
    connectedCallback(){
        console.log(this.info)
        this.init(); 
    }

    init(){
        getProducts({oppId: this.rec})
        .then((x)=>{
            console.log(x)
            let back  = [...x]; 
            this.prods = back.map(item=>{
               
                return {...item,
                    id: item.Id,
                    shortName: item.Product2.Name.length >31 ? item.Product2.Name.substring(0,30)+ '...' : item.Product2.Name,
                    unitPrice: item.CPQ_Unit_Price__c,
                    margin: item.Product2.Agency_Pricing__c ? '' : item.CPQ_Margin__c,
                    marginCal: item.Product2.Agency_Pricing__c || item.Product2.Name.includes('SHIPPING') ? 0 : 1,
                    goodMargin: !item.Product2.Agency_Pricing__c && item.CPQ_Margin__c > 30 ? true : false
                    }
                
            }); 
            
        })
        .then(()=>{
            // let full = info.deliveryDate
            // let year = full.substring(0,4);
            // let month = full.substring(5,7);
            // let day = full.substring(8,10); 
            // this.showDate = `${day}-${month}-${year}`
            if(this.prods){
                this.totalPrice = this.prods.reduce((a,b)=>a+b.TotalPrice,0)
                this.totalUnits = this.prods.reduce((a,b)=> a+b.Quantity, 0)
                let totalMarging = this.prods.reduce((a,b)=> a+b.margin, 0)
                let elMargin = this.prods.reduce((a,b)=> a+b.marginCal, 0)
                this.avgMargin = roundNum(totalMarging/elMargin,2); 
                this.goodMargin = this.avgMargin >= 28 ? true : false;
                this.greatmargin = this.avgMargin >=35 ? true : false; 
                this.fireMargin = this.avgMargin > 40 ? true : false;  
            }
        }).catch((err)=>{
            console.log(JSON.stringify(err));
        })
    }
    handleConfirm(){
        this.dispatchEvent(new CustomEvent('close'));
    }
}