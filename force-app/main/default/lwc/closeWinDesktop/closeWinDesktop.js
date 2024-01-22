//NEED A SPINNER 
//orderBy Comment
import { LightningElement, api, wire } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//import { refreshApex } from '@salesforce/apex';
import { getRecord, getFieldValue, updateRecord, getRecordNotifyChange  } from 'lightning/uiRecordApi';
import NAME from '@salesforce/schema/Opportunity.Name';
import QUOTENUM from '@salesforce/schema/Opportunity.Quote_Number__c';
import CLOSEDATE from '@salesforce/schema/Opportunity.CloseDate';
import STAGE from '@salesforce/schema/Opportunity.StageName';
import PO from '@salesforce/schema/Opportunity.Customer_PO__c';
import DELIVERYDATE from '@salesforce/schema/Opportunity.Delivery_Date_s_Requested__c';
import DELIVERDATE2 from '@salesforce/schema/Opportunity.To__c';
import SHIPTO from '@salesforce/schema/Opportunity.Shipping_Address__c';
import WH_NUMB from '@salesforce/schema/Opportunity.Warehouse_Numb__c';
import ACCID from '@salesforce/schema/Opportunity.AccountId';
import ACC_NAME from '@salesforce/schema/Opportunity.Account_Name_Text__c';
import ID_Field from '@salesforce/schema/Opportunity.Id';
import REQPO from '@salesforce/schema/Opportunity.Requires_PO_Number__c';
import PEST_DATE from '@salesforce/schema/Opportunity.Pest_Expiration_Date__c';
import RUP_PROD from '@salesforce/schema/Opportunity.RUP_Selected__c'; 
//import SALESPAD_READY from '@salesforce/schema/Opportunity.Ready_for_Salespad__c';
import HASITEMS from '@salesforce/schema/Opportunity.HasOpportunityLineItem'
import SHIPTYPE from '@salesforce/schema/Opportunity.Ship_Type__c';
//Account RUP info
import PEST_NUMB from '@salesforce/schema/Account.Pesticide_License__c';
import NEW_PEST_DATE from '@salesforce/schema/Account.Pest_License_Exp_Date__c'; 
import CUST_ID from '@salesforce/schema/Account.Id';
//EOP FIELDS
import EOP_ORDER from '@salesforce/schema/Opportunity.EOP_Order__c';
import EOP_PAYTYPE from '@salesforce/schema/Opportunity.EOP_Pay_Type__c';
import NUM_PAYMENTS from '@salesforce/schema/Opportunity.Number_of_Payments__c';
import FIRST_DATE from '@salesforce/schema/Opportunity.First_Due_Date__c';
import BILL_HOLD from '@salesforce/schema/Opportunity.BH_Yes_No__c';
import DISCOUNT from '@salesforce/schema/Opportunity.Discount_Percentage__c'
import EARLY_PAY from '@salesforce/schema/Opportunity.Early_Pay__c';
import INVOICE_DATE from '@salesforce/schema/Opportunity.Invoice_Date__c';
import BH_SIGNED from '@salesforce/schema/Opportunity.Bill_Hold_Signed__c';
//apex
import getAddress from '@salesforce/apex/cpqApex.getAddress';
import getPickListValues from '@salesforce/apex/lwcHelper.getPickListValues';
 
import {validate} from 'c/helper'
const FIELDS = [NAME, QUOTENUM, CLOSEDATE, STAGE, PO,DELIVERYDATE, DELIVERDATE2, SHIPTO, ACCID, REQPO, SHIPTYPE, HASITEMS, EOP_ORDER, EOP_PAYTYPE, 
    NUM_PAYMENTS, FIRST_DATE, BILL_HOLD, BH_SIGNED, DISCOUNT, EARLY_PAY, INVOICE_DATE, PEST_DATE, RUP_PROD, WH_NUMB, ACC_NAME];
const rules =[
    {test: (o) => o.accId.length === 18,
     message:`Didn't find an account with this order. Close this screen and select and account and hit SAVE`,
    type:'missingInfo'},
    {test: (o) => o.hasItems === true,
     message: 'No Products found. Close this screen and hit save on the products section',
     type:'missingInfo'}
]
//rules for RUP
const rupRules = [
    {test: (o) => o.expDate >= o.today,
    message: 'RUP Product Selected. License either expired or not found.',
    type:'rupMissing'}
]
//Bill and Hold Validation
const bhRules = [
    {test: (o) => o.billHoldSigned === true,
     message: 'You selected Bill and Hold, however, the agreement has not been signed or uploaded correctly',
     type:'missingInfo'}
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
    whNumb;  
    accName; 
    options;
    shipReq; 
    pestExp;
    rupSelected;
    errorMsg = {};
    custPOLabel;
    //allow users to save  
    disabledBtn;
    hasItems;
    eopOrder;
    eopPayType = '';
    numPayments = '';
    firstPayDate = ''; 
    billHold;
    billHoldSigned; 
    earlyPay;
    invoiceDate; 
    showEOPInfo = false;
    passVal = true; 
    rupError; 
    showLicenseUpLoad = false; 
    showConfirm = false;
    orderHeaders ={}
    //for evaluating time
    today = new Date().toJSON().substring(0,10);
    connectedCallback(){
    }
    @wire(getRecord,{recordId: '$recordId', fields:FIELDS})
        loadFields({data,error}){
            if(data){
                    this.accountId = getFieldValue(data, ACCID)?getFieldValue(data, ACCID): '';
                    this.hasItems = getFieldValue(data, HASITEMS); 
                    this.rupSelected = getFieldValue(data, RUP_PROD);
                    this.pestExp = getFieldValue(data, PEST_DATE);
                    this.billHold = getFieldValue(data, BILL_HOLD);
                    this.billHoldSigned = getFieldValue(data, BH_SIGNED); 
                    
                    let check = {accId: this.accountId, 
                                hasItems: this.hasItems, 
                                expDate:this.pestExp, 
                                today: this.today,
                                billHoldSigned: this.billHoldSigned}
                    
                    //IF YOU NEED BILL AND HOLD UNCOMMENT BELOW CHECK HELPER TOO
                    //let loadMore = validate(check, rules, rupRules, this.rupSelected, bhRules, this.billHold);
                    let loadMore = validate(check, rules, rupRules, this.rupSelected);
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
                    this.earlyPay = getFieldValue(data, EARLY_PAY);
                    this.invoiceDate = getFieldValue(data, INVOICE_DATE); 
                    this.whNumb = getFieldValue(data, WH_NUMB);
                    this.accName = getFieldValue(data, ACC_NAME); 
                    //this.firstPayDate = this.firstPayDate === '' ? this.handleSetPayDate(this.eopPayType) : '';
                    this.findAddress(this.accountId);
                    this.findShipTypes(); 
                    this.custPOLabel = this.reqPO ? 'This account requires a PO' : 'Customer PO#' 
                    this.loaded = true; 
                    this.shipReq = this.shipType === 'REP' || this.shipType === 'WI' ? false : true;
                    this.shipType = this.shipType === 'FG'  ? 'UG': this.shipType;
                }else{
                    this.passVal = loadMore.isValid; 
                    this.valErrs = loadMore.errors;
                    this.rupError = loadMore.errors[0].type === 'rupMissing' ? true : false; 

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
        {label:'Envu', value:'Envu'},
        {label:'FMC', value:'FMC'},
        {label:'SePRO', value:'SePRO'}
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
// get shipOptions() {
//     return [
//         // { label: 'FG - FedEx Ground', value: 'FG' },
//         { label: 'Rep - Sales Rep Deliver', value: 'REP' },
//         { label: 'TR - Truck', value: 'TR' },
//         { label: 'WI - Walk-In/Will Call', value: 'WI' },
//         { label: 'DS-Direct Ship', value: 'DS' },
//         { label: 'PC', value: 'PC' },
//         { label: 'PSL', value: 'PSL' },
//         { label: 'PU', value: 'PU' },
//         { label: 'LT', value: 'LT' },
//         { label: 'UG', value: 'UG' },
//         { label: 'T4', value: 'T4' }
//     ];
// }
shipOptions
    findShipTypes(){
         getPickListValues({objName: 'Opportunity', fieldAPI:'Ship_Type__c'})
            .then((x)=>{
                this.shipOptions = x; 
                
            })
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
    //console.log(this.eopOrder)
}
handlePay(event){
    //BASF 2023-06-07
    //Bayer 2023-06-02
    //FMC 2023-07-02
    this.eopPayType = event.detail.value;
    this.firstPayDate = this.handleSetPayDate(this.eopPayType); 
}
handleSetPayDate(payType){
    return payType === 'BASF' ? '2024-06-10' :
    payType === 'Envu' ? '2024-06-07' :
    payType === 'FMC' ? '2024-07-02' :
    payType ==='SePRO' ? '2024-07-01' :  ''; 
}
handleEarlyPay(event){
    this.earlyPay = event.detail.value; 
}
handleNumbOpts(event){
    this.numPayments = event.detail.value; 
}
handleDate(event){
    this.firstPayDate = event.detail.value; 
}
//Update Bill and Hold Status check storage agreement is signed on teh account
bhError
handleBillHold(event){
    this.billHold = event.detail.value;
    if(this.billHold === 'Yes' && !this.billHoldSigned ){
        this.bhError = true;
        this.disabledBtn = true; 
    }else{
        this.bhError = false; 
        this.disabledBtn = false;
    }    
}

handleInvoiceDate(event){
    this.invoiceDate = event.detail.value; 
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
// submitTest(event){
//     event.preventDefault();
//     const ok = this.isInputValid();
//     const eopOk = this.eopValid(); 
//     console.log(1, ok, 2,eopOk);
    
// }
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
            fields[BILL_HOLD.fieldApiName] = this.billHold; 
            fields[EARLY_PAY.fieldApiName] = this.earlyPay; 
            fields[INVOICE_DATE.fieldApiName] = this.invoiceDate; 
            fields[ID_Field.fieldApiName] = this.recordId; 
            const opp = {fields}
            this.orderHeaders.deliveryDate = this.deliveryDate;
            this.orderHeaders.shipType = this.shipType
            this.orderHeaders.po = this.po
            this.orderHeaders.accName = this.accName; 
            this.orderHeaders.whNumb = this.whNumb; 
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
                    this.showConfirm = true; 
                    //this.dispatchEvent(new CloseActionScreenEvent());
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
//validate closing input
    isInputValid() {
        let isValid = true;
        let inputFields = this.template.querySelectorAll('.validate');
        const ship = this.template.querySelector('.valAdd');
        //console.log(1, inputFields, 2, ship)
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
//Handle missing RUP 
    handleUpload(){
        this.showLicenseUpLoad = true; 
        //this.rupError = false; 
    }        
//RUP vars
    newPestDate;
    newPestNumber; 
    licenseUpLoaded = false; 
    handlePestChange(event){
        this.newPestNumber = event.detail.value
    }

    handleExpDate(evt){
        this.newPestDate = evt.detail.value
    }
    handleManager(){
        console.log('handle manager alert');
    }
    cancelUpload(){
        this.showLicenseUpLoad = false; 
        this.rupError = true;
    }
    //Handle File upload
    handleUploadFinished(event) {
        // Get the list of uploaded files
        const uploadedFiles = event.detail.files;
        this.licenseUpLoaded = uploadedFiles.length === 1 ? true : false; 
        
    }
//Acceptable file types for upload
    get acceptedFormats() {
        return ['.pdf', '.png', '.jpeg', '.jpg', '.csv', '.xlsx'];
    }
//validate that the fields on the Upload License Screen are actually filled out. 
    licenseInputValid() {
        let isValid = true;
        let inputFields = this.template.querySelectorAll('.licenseField');
    
        inputFields.forEach(inputField => {
            if(!inputField.checkValidity()) {
                inputField.reportValidity();
                isValid = false;
            }
            
            this.errorMsg[inputField.name] = inputField.value;
        });
        return isValid;
    }

//Save new license info then move to order page
    saveUpload(){
        let ok = this.licenseInputValid(); 
                 
        if(ok && this.licenseUpLoaded){
            this.loaded = false; 
            
            const fields = {};
            fields[PEST_NUMB.fieldApiName] = this.newPestNumber;
            
            fields[NEW_PEST_DATE.fieldApiName] = this.newPestDate;
            fields[CUST_ID.fieldApiName] = this.accountId;

            const recordInput = {fields};

            updateRecord(recordInput).then(()=>{
                console.log('refreshing Apex')
                getRecordNotifyChange([{recordId: this.recordId}]);
                console.log('refreshed.......')
            }).then(()=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'License Updated',
                        variant: 'success'
                    })
                );
                this.passVal = true; 
                this.showLicenseUpLoad = false; 
                this.loaded = true; 
            }).catch(error=>{
                console.log(JSON.stringify(error))
                let message = 'Unknown error';
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Saving Products',
                        message,
                        variant: 'error',
                    }),
                );
            })

        }
    }
}