//NEED A SPINNER 

import { LightningElement, api, wire } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
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
import HASITEMS from '@salesforce/schema/Opportunity.HasOpportunityLineItem'
import SHIPTYPE from '@salesforce/schema/Opportunity.Ship_Type__c';
//EOP FIELDS
import EOP_ORDER from '@salesforce/schema/Opportunity.EOP_Order__c';
import EOP_PAYTYPE from '@salesforce/schema/Opportunity.EOP_Pay_Type__c';
import NUM_PAYMENTS from '@salesforce/schema/Opportunity.Number_of_Payments__c';
import FIRST_DATE from '@salesforce/schema/Opportunity.First_Due_Date__c';

import getAddress from '@salesforce/apex/cpqApex.getAddress'
import {validate} from 'c/helper'
const FIELDS = [NAME, QUOTENUM, CLOSEDATE, STAGE, PO,DELIVERYDATE, DELIVERDATE2, SHIPTO, ACCID, REQPO, SHIPTYPE, HASITEMS, EOP_ORDER, EOP_PAYTYPE, NUM_PAYMENTS, FIRST_DATE]
const rules =[
    {test: (o) => o.accId.length === 18,
     message:`Didn't find an account with this order. Close this screen and select and account and hit SAVE`},
    {test: (o) => o.hasItems === true,
     message: 'No Products found. Close this screen and hit save on the products section'}
]
const eopRules = [
    {test: (o)=> o.eopOrder != '',
        field: 'eopOrder'},
    {test: (o)=>o.payType != '',
        field: 'eopPayType'}, 
    {test: (o)=>o.numPat != '',
        field: 'numPayments'},
    {test: (o) => o.dueDate != '',
        field: 'firstPayDate'}
]
export default class CloseWinDesktop extends LightningElement {
    @api recordId;
    @api objectApiName; 
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
    eopOrder;
    eopPayType = '';
    numPayments = '';
    firstPayDate = ''; 
    showEOPInfo = false;
    passVal = true; 
    connectedCallback(){
    }
    @wire(getRecord,{recordId: '$recordId', fields:FIELDS})
        loadFields({data,error}){
            if(data){
                    this.accountId = getFieldValue(data, ACCID)?getFieldValue(data, ACCID): '';
                    this.hasItems = getFieldValue(data, HASITEMS); 
                    //console.log(1, this.accountId, 2, this.hasItems)
                    let check = {accId: this.accountId, hasItems: this.hasItems}
                    let loadMore = validate(check, rules);
                   //console.log(loadMore)
                    if(loadMore.isValid){
                    this.name = getFieldValue(data, NAME);
                    this.quoteNumb = getFieldValue(data, QUOTENUM);
                    this.closeDate = getFieldValue(data, CLOSEDATE);
                    //this.stage = getFieldValue(data, STAGE);
                    this.po = getFieldValue(data, PO);
                    this.deliveryDate = getFieldValue(data, DELIVERYDATE);
                    this.deliverDate2 = getFieldValue(data, DELIVERDATE2);
                    this.shipTo = getFieldValue(data, SHIPTO); 
                    this.reqPO = getFieldValue(data, REQPO);
                    this.shipType = getFieldValue(data, SHIPTYPE);
                    this.eopOrder = getFieldValue(data, EOP_ORDER) ? getFieldValue(data, EOP_ORDER): '';
                    this.showEOPInfo = this.eopOrder === 'Yes' ? true : false; 
                    this.eopPayType = getFieldValue(data, EOP_PAYTYPE);
                    this.numPayments = getFieldValue(data, NUM_PAYMENTS);
                    this.firstPayDate = getFieldValue(data, FIRST_DATE);
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
        {label:'See Split Terms', value:'See Split Terms'}
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
//Stage Options
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
    }else{
        this.shipTo = newValue;
        console.log('new ship to '+this.shipTo);
        
    }
}

//Ship Change
handleShipChange(event){
    this.shipType = event.detail.value; 
}
handleEOP(event){
    this.eopOrder = event.detail.value; 
    this.showEOPInfo = this.eopOrder === 'Yes' ? true : false;
    console.log(this.eopOrder)
}
handlePay(event){
    this.eopPayType = event.detail.value;
}
handleNumbOpts(event){
    this.numPayments = event.detail.value; 
}
handleDate(event){
    this.firstPayDate = event.detail.value;
    console.log(this.firstPayDate);
    
}
//Stage Change
// handleStageChange(event) {
//     this.stage = event.detail.value;
// }
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
//Save Submit section!
    handleSave(){
        
        let ok = this.isInputValid();
        let eopOK = this.eopValid(); 
        if(ok && eopOK){
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
            //EOP INFO COMMENT OUT WHEN NOT USING
            fields[EOP_ORDER.fieldApiName] = this.eopOrder;
            fields[EOP_PAYTYPE.fieldApiName] = this.eopPayType;
            fields[NUM_PAYMENTS.fieldApiName] = this.numPayments;
            fields[FIRST_DATE.fieldApiName] = this.firstPayDate;
            //fields[SALESPAD_READY.fieldApiName] = true; 
            fields[ID_Field.fieldApiName] = this.recordId; 
            const opp = {fields}
            console.log(JSON.stringify(opp))
            updateRecord(opp)
                .then(()=>{
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Submitted',
                            message: 'Order Sent In!',
                            variant: 'success'
                        })
                    )
                })
                .then(()=>{
                    this.loaded = true; 
                    this.dispatchEvent(new CloseActionScreenEvent());
                })
                .catch(error=>{ 
                    console.log(JSON.stringify(error));
                    
                    this.dispatchEvent(
                        new ShowToastEvent({ 
                            title: 'Error Updating',
                            message: error.body.message,
                            variant:'error'
                        })
                    )
                    this.loaded = true; 
                })
            
        }else{
           console.log(this.errorMsg)
        }
    }
    handleCancel(){
        this.dispatchEvent(new CloseActionScreenEvent());
    }
    isInputValid() {
        let isValid = true;
        let inputFields = this.template.querySelectorAll('lightning-input');
        const ship = this.template.querySelector('.valAdd');
        inputFields.forEach(inputField => {
            if(!inputField.checkValidity()) {
                inputField.reportValidity();
                isValid = false;
            }else if(!ship.checkValidity()){
                ship.reportValidity(); 
                isValid = false; 
            }
            this.errorMsg[inputField.name] = inputField.value;
        });
        return isValid;
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
//New Address info
        cancelNewAddress(){
            this.info = true; 
        }

        updateAddress(event){
            let value = event.detail.value;
            
            let label = event.detail.label;
            let x = {value, label}
            this.options.push(x);
            this.info = true;
            const evt = new ShowToastEvent({
                title: 'Address Added',
                message: this.msg,
                variant: 'success'
            });
            this.dispatchEvent(evt);  
        }
}