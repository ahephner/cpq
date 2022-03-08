import { LightningElement, api, wire } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME from '@salesforce/schema/Opportunity.Name';
import QUOTENUM from '@salesforce/schema/Opportunity.Quote_Number_Test__c';
import CLOSEDATE from '@salesforce/schema/Opportunity.CloseDate';
import STAGE from '@salesforce/schema/Opportunity.StageName';
import PO from '@salesforce/schema/Opportunity.Customer_PO__c';
import DELIVERYDATE from '@salesforce/schema/Opportunity.Delivery_Date_s_Requested__c';
import DELIVERDATE2 from '@salesforce/schema/Opportunity.To__c';
import SHIPTO from '@salesforce/schema/Opportunity.Shipping_Address__c'
import ACCID from '@salesforce/schema/Opportunity.AccountId';
import getAddress from '@salesforce/apex/cpqApex.getAddress'
const FIELDS = [NAME, QUOTENUM, CLOSEDATE, STAGE, PO,DELIVERYDATE, DELIVERDATE2, SHIPTO, ACCID]
export default class CloseWinDesktop extends LightningElement {
    @api recordId;
    @api objectApiName; 
    info=true; 
    name 
    quoteNumb; 
    closeDate;
    stage;
    po;
    deliveryDate;
    deliverDate2;
    accId;
    shipTo; 
    options; 
    localError;
    errorMsg;

    @wire(getRecord,{recordId: '$recordId', fields:FIELDS})
        loadFields({data,error}){
            if(data){
                this.name = getFieldValue(data, NAME);
                this.quoteNumb = getFieldValue(data, QUOTENUM);
                this.closeDate = getFieldValue(data, CLOSEDATE);
                this.stage = getFieldValue(data, STAGE);
                this.po = getFieldValue(data, PO);
                this.deliveryDate = getFieldValue(data, DELIVERYDATE);
                this.deliverDate2 = getFieldValue(data, DELIVERDATE2);
                this.accId = getFieldValue(data, ACCID);
                this.shipTo = getFieldValue(data, SHIPTO); 
                this.findAddress(this.accId); 
            }else if(error){
                let err = JSON.stringify(error);
                alert(err)
            }
        }

    //get address stuff
    //get the avaliable ship to options
    findAddress(rec){
        getAddress({accID: rec})
           .then((res)=>{
               this.options = res.map(item=>({
                                   ...item,
                                   label: item.Street +' ('+item.Name+')',
                                   value: item.Id
               }))
               // console.log('type of options '+typeof this.options);
               // console.log(JSON.stringify(this.options))
           }).catch((error)=>{
               this.error = error;
               console.log('error  '+this.error);
               
           }).finally(()=>{
           
           })
   }
   get selectedObj(){
    let label;
        if(this.options && this.selected){
            label = this.options.find((x)=>x.value===this.shipTo)
        }
        
        return label;   
}

selectChange(event){
    let newValue = this.template.querySelector('.slds-select').value;
    if(newValue === "new"){ 
        console.log('selecting new');
    }else{
        this.shipTo = newValue;
        console.log('new ship to '+this.shipTo);
        
    }
}

    handleSave(){
        let ok = this.valid();
        if(ok){
            console.log('good')
            const fields = {}
            fields[NAME.fieldApiName] = this.name;
            fields[QUOTENUM.fieldApiName] = this.quoteNumb;
            fields[CLOSEDATE.fieldApiName] = this.closeDate;
            fields[STAGE.fieldApiName] = this.stage;
            fields[PO.fieldApiName] = this.po;
            fields[DELIVERYDATE.fieldApiName] = this.deliveryDate;
            fields[DELIVERDATE2.fieldApiName] = this.deliverDate2;
            fields[SHIPTO.fieldApiName] = this.shipTo;
            
        }else{
            this.localError = true;
            this.errorMsg = this.valid(); 
        }
    }
    handleCancel(){
        this.dispatchEvent(new CloseActionScreenEvent());
    }
    valid(){
        let mess;
        console.log(1,this.shipTo, 2, this.deliveryDate);
        
        if(this.shipTo === null || !this.shipTo ){
            mess = 'Add a ship to';
            return mess; 
        }else if(this.deliveryDate === null || !this.deliveryDate){
            mess = 'Add a delivery date'
            return mess; 
        }else{
            return; 
        } 
        

    }
}