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
//import SALESPAD_READY from '@salesforce/schema/Opportunity.Ready_for_Salespad__c';
import SHIPTYPE from '@salesforce/schema/Opportunity.Ship_Type__c';
import HASITEMS from '@salesforce/schema/Opportunity.HasOpportunityLineItem'
//EOP FIELDS
import EOP_ORDER from '@salesforce/schema/Opportunity.EOP_Order__c';
import EOP_PAYTYPE from '@salesforce/schema/Opportunity.EOP_Pay_Type__c';
import NUM_PAYMENTS from '@salesforce/schema/Opportunity.Number_of_Payments__c';
import FIRST_DATE from '@salesforce/schema/Opportunity.First_Due_Date__c';
import BILL_HOLD from '@salesforce/schema/Opportunity.BH_Yes_No__c';
import EARLY_PAY from '@salesforce/schema/Opportunity.Early_Pay__c';

import getAddress from '@salesforce/apex/cpqApex.getAddress';
import {validate} from 'c/helper'
const FIELDS = [EOP_ORDER, NAME, QUOTENUM, CLOSEDATE, STAGE, PO,DELIVERYDATE, DELIVERDATE2, SHIPTO, ACCID, REQPO,  SHIPTYPE, HASITEMS, EARLY_PAY];
const rules =[
    {test: (o) => o.accId.length === 18,
     message:`Didn't find an account with this order. Close this screen and select and account and hit SAVE`},
    {test: (o) => o.hasItems === true,
     message: 'No Products found. Close this screen and hit save on the products section'}
]
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
    hasItems; 
    passVal = true; 
    valErrs;
    //EOP INFO
    eopOrder
    eopPayType
    numPayments;
    billHold; 
    earlyPay;
    showEOPInfo = false;
    @wire(getRecord,{recordId: '$recordId', fields:FIELDS})
        loadFields({data,error}){
            if(data){
                
                        
                        this.accountId = getFieldValue(data, ACCID) ? getFieldValue(data, ACCID) : '';
                        this.hasItems = getFieldValue(data, HASITEMS);
                        let check = {accId: this.accountId, hasItems: this.hasItems}
                        let loadMore = validate(check, rules)
                        
                        if(loadMore.isValid){
                            this.name = getFieldValue(data, NAME);
                            this.quoteNumb = getFieldValue(data, QUOTENUM);
                            this.closeDate = getFieldValue(data, CLOSEDATE);
                            //this.stage = getFieldValue(data, STAGE);
                            this.po = getFieldValue(data, PO);
                            this.deliveryDate = getFieldValue(data, DELIVERYDATE);
                            this.deliverDate2 = getFieldValue(data, DELIVERDATE2);
                            this.shipTo = getFieldValue(data, SHIPTO); 
                            this.shipType = getFieldValue(data, SHIPTYPE);
                            this.reqPO = getFieldValue(data, REQPO);
                            this.eopOrder = getFieldValue(data, EOP_ORDER) ? getFieldValue(data, EOP_ORDER): '';
                            this.showEOPInfo = this.eopOrder === 'Yes' ? true : false; 
                            this.eopPayType = getFieldValue(data, EOP_PAYTYPE);
                            this.numPayments = getFieldValue(data, NUM_PAYMENTS);
                            this.firstPayDate = getFieldValue(data, FIRST_DATE);
                            this.billHold = getFieldValue(data, BILL_HOLD); 
                            this.earlyPay = getFieldValue(data, EARLY_PAY)
                            this.findAddress(this.accountId);
                            this.custPOLabel = this.reqPO ? 'This account requires a PO' : 'Customer PO#' 
                            this.loaded = true; 
                            this.shipReq = this.shipType === 'REP' || this.shipType === 'WI' ? false : true; 
                        }else{
                            this.passVal = loadMore.isValid; 
                            this.valErrs = loadMore.errors;
                            this.loaded = true; 
                       }
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
//EOP Order Option
get EOPOptions(){
    return [
        {label: 'Yes', value: 'Yes'},
        {label: 'No', value:'No'}
    ]
}

get payOptions(){
    return [
        {label:'Set Due Date',value:'Set Due Date'},
        {label:'See Split Terms', value:'See Split Terms'},
        {label:'BASF', value:'BASF'},
        {label:'Bayer', value:'Bayer'},
        {label:'FMC', value:'FMC'}
    ]
}

get numOptions(){
    return [
        {label:'1', value:'1'},
        {label:'2', value:'2'},
        {label:'3', value:'3'},
        {label:'4', value:'4'},
        {label:'5', value:'5'},
        {label:'6', value:'6'},
    ]
}

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
//EOP FUNCTIONS
handleEOP(event){
    this.eopOrder = event.detail.value; 
    this.showEOPInfo = this.eopOrder === 'Yes' ? true : false;
    
}
handlePay(event){
    this.eopPayType = event.detail.value;
    this.firstPayDate = this.handleSetPayDate(this.eopPayType); 
}
handleEarlyPay(event){
    this.earlyPay = event.detail.value; 
}

handleSetPayDate(payType){
    return payType === 'BASF' ? '2023-06-07' :
    payType === 'Bayer' ? '2023-06-02' :
    payType === 'FMC' ? '2023-07-02' : ''; 
}
handleNumbOpts(event){
    this.numPayments = event.detail.value; 
}
handleDate(event){
    this.firstPayDate = event.detail.value; 
}
handleBillHold(event){
    this.billHold = event.detail.value;  
}
submitTest(event){
    event.preventDefault();
    const ok = this.isInputValid();
    const eopOk = this.eopValid(); 
    console.log(1, ok.isValid, 2, ok.validShip, 3,eopOk);
    
}
submit(event) {
    event.preventDefault();      
    const ok = this.isInputValid();
    const eopOk = this.eopValid();
    console.log(1, ok.isValid, 2, ok.validShip, 3,eopOk);
    if(ok.isValid && ok.validShip && eopOk){
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
        fields[BILL_HOLD.fieldApiName] = this.billHold; 
        fields[EARLY_PAY.fieldApiName] = this.earlyPay; 
        fields[ID_Field.fieldApiName] = this.recordId; 
        const opp = {fields}
        console.log(JSON.stringify(opp))
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
    }else{
        console.log('missing something')
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
            ship.reportValidity(); 
            isValid = true; 
        }
        //this.errorMsg[inputField.name] = inputField.value;
    });
    return {isValid, validShip};
}

//check eop fields
eopValid(){
    let isValid = true; 
    let inputFields = this.template.querySelectorAll('.eopInputs')
    const orderType = this.template.querySelector('.eopInput');
    
    if(this.eopOrder === ''){
        orderType.reportValidity();
        isValid = false
    }else if(this.eopOrder === 'Yes'){
        inputFields.forEach(x=>{
            if(!x.checkValidity()){
                x.reportValidity();
                isValid = false;
            }
        })
    }

    return isValid; 
    }
}