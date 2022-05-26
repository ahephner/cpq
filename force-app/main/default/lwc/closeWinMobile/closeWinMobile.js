import { LightningElement,wire,api } from 'lwc';
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import NAME from '@salesforce/schema/Opportunity.Name';
import QUOTENUM from '@salesforce/schema/Opportunity.Quote_Number__c';
import CLOSEDATE from '@salesforce/schema/Opportunity.CloseDate';
import STAGE from '@salesforce/schema/Opportunity.StageName';
import PO from '@salesforce/schema/Opportunity.Customer_PO__c';
import DELIVERYDATE from '@salesforce/schema/Opportunity.Delivery_Date_s_Requested__c';
import DELIVERDATE2 from '@salesforce/schema/Opportunity.To__c';
import SHIPTO from '@salesforce/schema/Opportunity.Shipping_Address__c'
import ACCID from '@salesforce/schema/Opportunity.AccountId';
import ID_Field from '@salesforce/schema/Opportunity.Id';
import REQPO from '@salesforce/schema/Opportunity.Requires_PO_Number__c';
import SALESPAD_READY from '@salesforce/schema/Opportunity.Ready_for_Salespad__c';
import SHIPTYPE from '@salesforce/schema/Opportunity.Ship_Type__c';
import getAddress from '@salesforce/apex/cpqApex.getAddress'
const FIELDS = [NAME, QUOTENUM, CLOSEDATE, STAGE, PO,DELIVERYDATE, DELIVERDATE2, SHIPTO, ACCID, REQPO,  SHIPTYPE]
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
    shipType;
    options;
    shipReq; 
    errorMsg = {};
    custPOLabel; 
    @wire(getRecord,{recordId: '$recordId', fields:FIELDS})
        loadFields({data,error}){
            if(data){
                
                        this.noProducts = false; 
                        this.name = getFieldValue(data, NAME);
                        this.quoteNumb = getFieldValue(data, QUOTENUM);
                        this.closeDate = getFieldValue(data, CLOSEDATE);
                        //this.stage = getFieldValue(data, STAGE);
                        this.po = getFieldValue(data, PO);
                        this.deliveryDate = getFieldValue(data, DELIVERYDATE);
                        this.deliverDate2 = getFieldValue(data, DELIVERDATE2);
                        this.accountId = getFieldValue(data, ACCID);
                        this.shipTo = getFieldValue(data, SHIPTO); 
                        this.shipType = getFieldValue(data, SHIPTYPE);
                        this.reqPO = getFieldValue(data, REQPO);
                        this.findAddress(this.accountId);
                        this.custPOLabel = this.reqPO ? 'This account requires a PO' : 'Customer PO#' 
                        this.loaded = true; 
                        this.shipReq = this.shipType === 'REP' || this.shipType === 'WI' ? false : true; 
                    
            }else if(error){
                let err = JSON.stringify(error);
                alert(err)
            }
        }
//Stage Options
// get stageOptions() {
//     return [
//         { label: 'Pricing', value: 'Pricing' },
//         { label: 'Working', value: 'Working' },
//         { label: 'Quote', value: 'Quote' },
//         { label: 'Closed Won', value: 'Closed Won' },
//         { label: 'Closed Lost', value: 'Closed Lost' },
//     ];
// }
//get ship types
get shipOptions() {
    return [
        { label: 'FG - FedEx Ground', value: 'FG' },
        { label: 'Rep - Sales Rep Deliver', value: 'REP' },
        { label: 'TR - Truck', value: 'TR' },
        { label: 'WI - Walk-In/Will Call', value: 'WI' },
        { label: 'DS-Direct Ship', value: 'DS' },
        { label: 'PC', value: 'PC' },
        { label: 'PSL', value: 'PSL' },
        { label: 'PU', value: 'PU' },
        { label: 'LT', value: 'LT' },
        { label: 'UG', value: 'UG' },
        { label: 'T4', value: 'T4' }
    ];
}
    //get address stuff
    //get the avaliable ship to options
    findAddress(rec){
        getAddress({accID: rec})
           .then((res)=>{
               this.options = res.map(item=>({
                                   ...item,
                                   label: item.Street +' ('+item.Name+') - '+item.City,
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
        if(this.options && this.shipTo){
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
updateAddress(event){
    let value = event.detail.value;
    console.log('evt detail '+value);
    let label = event.detail.label;
    let x = {value, label}
    this.options.push(x);
    console.log(2, this.options);
    
    this.info = true;
    const evt = new ShowToastEvent({
        title: 'Address Added',
        message: this.msg,
        variant: 'success'
    });
    this.dispatchEvent(evt);  
}

//Stage Change
// handleStageChange(event) {
//     this.stage = event.detail.value;
// }
handleShipChange(event){
    this.shipType = event.detail.value;
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
submit(event) {
    event.preventDefault();      
    const ok = this.isInputValid();
    console.log(ok)
    if(ok.isValid && ok.validShip){
        this.loaded = false; 
        const fields = {}
        fields[NAME.fieldApiName] = this.name;
        fields[QUOTENUM.fieldApiName] = this.quoteNumb;
        fields[CLOSEDATE.fieldApiName] = this.closeDate;
        fields[STAGE.fieldApiName] = this.stage;
        fields[PO.fieldApiName] = this.po;
        fields[DELIVERYDATE.fieldApiName] = this.deliveryDate;
        fields[DELIVERDATE2.fieldApiName] = this.deliverDate2;
        fields[SHIPTO.fieldApiName] = this.shipTo;
        fields[SHIPTYPE.fieldApiName] = this.shipType; 
        //fields[SALESPAD_READY.fieldApiName] = true; 
        fields[ID_Field.fieldApiName] = this.recordId; 
        const opp = {fields}
        //console.log(JSON.stringify(opp))
        updateRecord(opp)
            .then(()=>{
                alert('New Order Submitted!');
            })
            .then(()=>{
                this.loaded = true; 
                this.dispatchEvent(new CustomEvent('close'));
            })
            .catch(error=>{ 
                console.log(JSON.stringify(error));
                alert(error.body.output.errors[0].message)
                this.loaded = true; 
            })
        
    }else if(ok.isValid && !ok.validShip){
        console.log('in here')
      alert('Missing Ship Address')
    }
    //this.dispatchEvent(new CustomEvent('close'));
  }
  cancel() {
    this.dispatchEvent(new CustomEvent('close'));
   
  }
  isInputValid() {
    let isValid = true;
    let validShip = true; 
    let inputFields = this.template.querySelectorAll('lightning-input');
    //alert(inputFields)
    const ship = this.template.querySelector('.valAdd');
    inputFields.forEach(inputField => {
        if(!inputField.checkValidity()) {
            inputField.reportValidity();
            isValid = false;
        }else if(!ship.checkValidity()){
           validShip = false;  
          //ship.reportValidity(); 
          isValid = true; 
        }
        //this.errorMsg[inputField.name] = inputField.value;
    });
    return {isValid, validShip};
}
}