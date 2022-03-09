import { LightningElement,wire,api } from 'lwc';
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import NAME from '@salesforce/schema/Opportunity.Name';
import QUOTENUM from '@salesforce/schema/Opportunity.Quote_Number_Test__c';
import CLOSEDATE from '@salesforce/schema/Opportunity.CloseDate';
import STAGE from '@salesforce/schema/Opportunity.StageName';
import PO from '@salesforce/schema/Opportunity.Customer_PO__c';
import DELIVERYDATE from '@salesforce/schema/Opportunity.Delivery_Date_s_Requested__c';
import DELIVERDATE2 from '@salesforce/schema/Opportunity.To__c';
import SHIPTO from '@salesforce/schema/Opportunity.Shipping_Address__c'
import ACCID from '@salesforce/schema/Opportunity.AccountId';
import ID_Field from '@salesforce/schema/Opportunity.Id';
import REQPO from '@salesforce/schema/Opportunity.Requires_PO_Number__c';
import getAddress from '@salesforce/apex/cpqApex.getAddress'
const FIELDS = [NAME, QUOTENUM, CLOSEDATE, STAGE, PO,DELIVERYDATE, DELIVERDATE2, SHIPTO, ACCID, REQPO]
export default class CloseWinMobile extends LightningElement {
    
    @api recordId; 
    msg = 'Adding an address can slow quote acceptance by up to 10 mins in the system'
    info=true; 
    name;
    loaded=false
    quoteNumb; 
    closeDate;
    stage = 'Closed Won';
    po;
    reqPO 
    deliveryDate;
    deliverDate2;
    accountId;
    shipTo;
    options;
    errorMsg = {};
    custPOLabel; 
    @wire(getRecord,{recordId: '$recordId', fields:FIELDS})
        loadFields({data,error}){
            if(data){
                this.name = getFieldValue(data, NAME);
                this.quoteNumb = getFieldValue(data, QUOTENUM);
                this.closeDate = getFieldValue(data, CLOSEDATE);
                //this.stage = getFieldValue(data, STAGE);
                this.po = getFieldValue(data, PO);
                this.deliveryDate = getFieldValue(data, DELIVERYDATE);
                this.deliverDate2 = getFieldValue(data, DELIVERDATE2);
                this.accountId = getFieldValue(data, ACCID);
                this.shipTo = getFieldValue(data, SHIPTO); 
                this.reqPO = getFieldValue(data, REQPO);
                this.findAddress(this.accountId);
                this.custPOLabel = this.reqPO ? 'This account requires a PO' : 'Customer PO#' 
                this.loaded = true; 
            }else if(error){
                let err = JSON.stringify(error);
                alert(err)
            }
        }
//Stage Options
get stageOptions() {
    return [
        { label: 'Pricing', value: 'Pricing' },
        { label: 'Working', value: 'Working' },
        { label: 'Quote', value: 'Quote' },
        { label: 'Closed Won', value: 'Closed Won' },
        { label: 'Closed Lost', value: 'Closed Lost' },
    ];
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
//Change Sections
//new Ship Address
selectChange(event){
    let newValue = this.template.querySelector('.slds-select').value;
    if(newValue === "new"){ 
        this.info = false;
        //console.log('new address please');
         
    }else{
        this.shipTo = newValue;
        console.log('new ship to '+this.shipTo);
        
    }
}

//Stage Change
handleStageChange(event) {
    this.stage = event.detail.value;
}
//New Name
newName(e){
    this.name = e.detail.value; 
}

newCloseDate(e){
    this.closeDate = e.detail.value; 
}

newPo(e){
    this.po = e.detail.value; 
}

newDeliveryDate(e){
    this.deliveryDate = e.detail.value; 
}

newDevDate2(e){
    this.deliverDate2 = e.detail.value; 
}
//New Address info
cancelNewAddress(){
    this.info = true; 
}
  save() {
    console.log('rec id '+this.recordId); 
    //this.dispatchEvent(new CustomEvent('close'));
  }
  cancel() {
    this.dispatchEvent(new CustomEvent('close'));
   
  }
}