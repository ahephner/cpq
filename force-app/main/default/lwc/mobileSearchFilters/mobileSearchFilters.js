import { LightningElement, api, wire,track } from 'lwc';
import { getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
// There is a bug I can only get one picklist value in this comp. Whatever is the last called gets filled. Probally because I am doing something wrong. 
export default class MobileSearchFilters extends LightningElement {
    exposed = false; 
    pf; 
    cat;
    pfLabel = 'All';
    catLabel ='All';
    @api objectName = 'Product2';
    @api fieldName = 'Subcategory__c';
    @track fieldLabel;
    @api recordTypeId;
    @api value;
    @track subOptions;
    @track famOptions;
    apiFieldName;
    subCat = 'Product2.Subcategory__c';
    productFamily = 'Product2.Product_Family__c';
    @api
    openFilter(){
        this.exposed = true; 
    }
    closeModal(){
        this.exposed = false; 
    }
    cancel(){
        this.pf = 'All';
        this.cat = 'All';
        this.updateFilter(this.cat, this.pf)
        this.closeModal(); 
    }
    @wire(getObjectInfo, { objectApiName: '$objectName' })
    getObjectData({ error, data }) {
        if (data) {
            if (this.recordTypeId == null)
                this.recordTypeId = data.defaultRecordTypeId;
                this.value = data.defaultRecordTypeId;
            
        } else if (error) {
            // Handle error
            console.log('==============Error  ');
            alert(error);
        }
    }
     //get product family options
    //  @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: '$productFamily' })
    //  getPicklistValues({ error, data }) {
    //      if (data) {
    //          // Map picklist values
    //          this.famOptions = data.values.map(plValue => {
    //              return {
    //                  label: plValue.label,
    //                  value: plValue.value
    //              };
    //          });
    //          console.log('get family ');
    //          console.log(this.famOptions[0]);
    //      } else if (error) {
    //          // Handle error
    //          console.log('==============Error  ' + error);
    //          console.log(error);
    //      }
    //  }
    //hardcoded families
    get pfOptions(){
        return [
            {label: 'All', value:'All'},
            {label: 'Alligare', value:'Alligare'},
            {label: 'AMVAC', value:'AMVAC'},
            {label: 'Andersons', value:'Andersons'},
            {label: 'Aquatrols', value:'Aquatrols'},
            {label: 'ArmorTech	', value:'ArmorTech'},
            {label: 'Barenbrug', value:'Barenbrug'},
            {label: 'BASF', value:'BASF'}, 
            {label: 'Brandt', value:'Brandt'},
            {label: 'Corteva', value:'Corteva'},
            {label: 'CSI', value:'Quali-Pro'},
            {label: 'E.C. Grow', value:'E.C. Grow'},
            {label: 'FMC', value:'FMC'},
            {label: 'Foliar-Pak', value:'FoliarPak'},
            {label: 'Holganix', value:'Holganix'},
            {label: 'House', value:'House'},
            {label: 'JRM', value:'JRM'},
            {label: 'Lebanon', value:'Lebanon'},
            {label: 'Linemark International', value:'Linemark International'},
            {label: 'Nufarm', value:'Nufarm'},
            {label: 'Par Aide', value:'Par Aide'},
            {label: 'PBI-Gordon', value:'PBI-Gordon'},
            {label: 'Precision Laboratories', value:'Precision Laboratories'},
            {label: 'Quest Products', value:'Quest Products'},
            {label: 'Rotam', value:'Rotam'},
            {label: 'SePRO', value:'SePRO'},
            {label: 'Sipcam', value:'Sipcam'},
            {label: 'Standard', value:'Standard Golf'},
            {label: 'Spectrum Technologies', value:'Spectrum Technologies'},
            {label: 'Turf Max', value:'Turf Max'},
            {label: 'Steel Green', value:'Steel Green'},
            {label: 'Spyker', value:'Spyker'},
            {label: 'Curve-Rite', value:'Curve-Rite'},
            {label: 'Techniseal', value:'Techniseal'},
            {label: 'Techo', value:'Techo'},
            {label: 'Unilock', value:'Unilock'}
        ]
    }
      //need this to get picklist
        @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: '$subCat' })
        getPicklistValues({ error, data }) {
            if (data) {
                // Map picklist values
                this.subOptions = data.values.map(plValue => {
                    return {
                        label: plValue.label,
                        value: plValue.value
                    };
                    
                });
    
            } else if (error) {
                // Handle error
                console.log('==============Error  ' + error);
                console.log(error);
            }
        }

    catChange(x){
        this.cat = x.detail.value; 
        this.catLabel = x.target.options.find(opt => opt.value === x.detail.value).label; 
        console.log('this pf '+this.pf);
                
    }
    pfChange(x){
        this.pf = x.detail.value; 
         
    }

    updateFilter(){
        let filters = this.pf ?{cat: this.cat, catLab: this.catLabel, pf: this.pf}: {cat: this.cat, catLab: this.catLabel, pf:'All'}; 
        
        
        const updateFilter = new CustomEvent('filterchange',{detail: filters});
        this.dispatchEvent(updateFilter);      
        
        // this.closeModal(); 
        //close filter page
        const closeFilter = new CustomEvent('closefilter');
        this.dispatchEvent(closeFilter)
    }
}